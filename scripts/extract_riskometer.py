"""
Extract Riskometer (Risk Band) from XLS/XLSX Scheme Summary Documents

This script:
1. Reads XLS/XLSX files containing Scheme Summary Documents
2. Extracts Field #5: "Riskometer (as on Date)"
3. Updates funddetails collection with riskBand values (1-5)

Usage:
    python scripts/extract_riskometer.py <path-to-xls-folder>
    python scripts/extract_riskometer.py SSD-files/

Requirements:
    pip install openpyxl pymongo python-dotenv
"""

import os
import sys
import re
from pathlib import Path
from typing import Optional, Dict, List
import openpyxl
from pymongo import MongoClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Risk band mapping - handles various text formats
RISK_BAND_MAP = {
    'Risk Band Level 1': 1,
    'Risk Band Level 2': 2,
    'Risk Band Level 3': 3,
    'Risk Band Level 4': 4,
    'Risk Band Level 5': 5,
    'Low Risk': 1,
    'Low to Moderate Risk': 2,
    'Moderate Risk': 3,
    'Moderately High Risk': 4,
    'High Risk': 5,
}


def extract_from_xls(file_path: Path) -> Dict[str, Optional[any]]:
    """
    Extract fund name and riskometer from XLS file
    Expected format: Field/Value pairs in columns A and B
    Field 1: Fund Name
    Field 5: Riskometer (as on Date)
    """
    try:
        workbook = openpyxl.load_workbook(file_path, data_only=True)
        sheet = workbook.active
        
        fund_name = None
        risk_band = None
        
        # Iterate through rows
        for row in sheet.iter_rows(values_only=True):
            if not row or len(row) < 2:
                continue
                
            field_label = str(row[0] or '').strip()
            field_value = str(row[1] or '').strip()
            
            # Field 1: Fund Name
            if field_label == '1' or 'fund name' in field_label.lower():
                fund_name = field_value
            
            # Field 5: Riskometer (as on Date)
            if field_label == '5' or ('riskometer' in field_label.lower() and 'as on' in field_label.lower()):
                # Try to extract numeric value
                numeric_match = re.search(r'(\d)', field_value)
                if numeric_match:
                    risk_band = int(numeric_match.group(1))
                elif field_value in RISK_BAND_MAP:
                    risk_band = RISK_BAND_MAP[field_value]
        
        # Clean fund name
        if fund_name:
            fund_name = re.sub(r'\s*-\s*(Regular|Direct)\s*Plan.*', '', fund_name, flags=re.IGNORECASE)
            fund_name = re.sub(r'\s*-\s*Growth.*', '', fund_name, flags=re.IGNORECASE)
            fund_name = re.sub(r'\s*-\s*IDCW.*', '', fund_name, flags=re.IGNORECASE)
            fund_name = fund_name.strip()
        
        return {
            'fundName': fund_name,
            'riskBand': risk_band,
            'fileName': file_path.name
        }
    
    except Exception as e:
        print(f"Error reading {file_path.name}: {e}")
        return {
            'fundName': None,
            'riskBand': None,
            'fileName': file_path.name
        }


def process_directory(dir_path: str) -> List[Dict]:
    """Process all XLS files in a directory"""
    dir_path = Path(dir_path)
    
    if not dir_path.exists():
        print(f"✗ Directory not found: {dir_path}")
        sys.exit(1)
    
    # Find all XLS/XLSX files
    files = list(dir_path.glob('*.xls')) + list(dir_path.glob('*.xlsx'))
    
    if not files:
        print('✗ No XLS/XLSX files found in directory')
        sys.exit(1)
    
    print(f"Found {len(files)} XLS/XLSX files\n")
    
    results = []
    
    for file_path in files:
        data = extract_from_xls(file_path)
        if data['fundName'] and data['riskBand']:
            results.append(data)
            print(f"✓ {data['fileName']}")
            print(f"  Fund: {data['fundName']}")
            print(f"  Risk Band: {data['riskBand']}")
        else:
            print(f"⚠ {data['fileName']} - Missing data (fundName: {bool(data['fundName'])}, riskBand: {bool(data['riskBand'])})")
    
    return results


def update_database(results: List[Dict], mongo_uri: str):
    """Update MongoDB with extracted risk bands"""
    client = MongoClient(mongo_uri)
    db = client.get_default_database()
    fund_details = db['funddetails']
    
    updated = 0
    not_found = 0
    failed = 0
    
    print(f"\nUpdating database...")
    
    for item in results:
        fund_name = item['fundName']
        risk_band = item['riskBand']
        file_name = item['fileName']
        
        try:
            # Try exact match first
            result = fund_details.update_one(
                {'fundName': fund_name},
                {'$set': {'riskBand': risk_band}}
            )
            
            # If not found, try case-insensitive regex match
            if result.matched_count == 0:
                pattern = re.compile(f'^{re.escape(fund_name)}$', re.IGNORECASE)
                result = fund_details.update_one(
                    {'fundName': pattern},
                    {'$set': {'riskBand': risk_band}}
                )
            
            if result.matched_count > 0:
                updated += 1
                print(f"  ✓ Updated: {fund_name} → Risk Band {risk_band}")
            else:
                not_found += 1
                print(f"  ⚠ Not found in DB: {fund_name} (from {file_name})")
        
        except Exception as e:
            failed += 1
            print(f"  ✗ Error updating {fund_name}: {e}")
    
    print(f"\n=== Summary ===")
    print(f"Total processed: {len(results)}")
    print(f"Updated: {updated}")
    print(f"Not found: {not_found}")
    print(f"Failed: {failed}")
    
    client.close()


def main():
    if len(sys.argv) < 2:
        print('Usage: python scripts/extract_riskometer.py <path-to-xls-folder>')
        print('Example: python scripts/extract_riskometer.py ./SSD-files/')
        sys.exit(1)
    
    dir_path = sys.argv[1]
    
    print('=== Riskometer Extraction Tool ===\n')
    
    # Extract from XLS files
    results = process_directory(dir_path)
    
    if not results:
        print('✗ No valid data extracted from XLS files')
        sys.exit(1)
    
    # Get MongoDB URI
    mongo_uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/sifcase')
    
    # Update database
    update_database(results, mongo_uri)
    
    print('\n✓ Done!')


if __name__ == '__main__':
    main()
