# Document Upload Flow

## Overview

Your application allows admins to upload PDF and Excel documents (factsheets, KIM, etc.) to **Cloudinary** and associate them with fund details. The flow uses **client-side direct upload** with **server-signed credentials**.

---

## Architecture

```
┌──────────────────┐
│  Admin Browser   │
│  (Client-Side)   │
└────────┬─────────┘
         │
         │ 1. Request Upload Signature
         ▼
┌──────────────────────────────────────┐
│ /api/admin/fund-details/            │
│    cloudinary-signature              │
│ (Server-Side - Signs Upload)         │
└────────┬─────────────────────────────┘
         │
         │ 2. Returns Signature + Credentials
         ▼
┌──────────────────┐
│  Admin Browser   │
│  Uploads File    │
└────────┬─────────┘
         │
         │ 3. Direct Upload (XHR with Progress)
         ▼
┌──────────────────────────────────────┐
│  Cloudinary CDN                      │
│  (https://api.cloudinary.com)        │
└────────┬─────────────────────────────┘
         │
         │ 4. Returns File URL
         ▼
┌──────────────────┐
│  Admin Browser   │
│  Stores URL      │
└────────┬─────────┘
         │
         │ 5. Save Fund Details (with file URLs)
         ▼
┌──────────────────────────────────────┐
│ /api/admin/fund-details/save         │
│ (Stores URLs in MongoDB)             │
└──────────────────────────────────────┘
```

---

## Files Involved

### 1. **Frontend UI Component**
**File:** `src/app/admin/fund-details/page.tsx`

### 2. **Signature API Route**
**File:** `src/app/api/admin/fund-details/cloudinary-signature/route.ts`

### 3. **Save API Route**
**File:** `src/app/api/admin/fund-details/save/route.ts`

### 4. **Database Model**
**File:** `src/models/FundDetails.ts`

---

## Step-by-Step Flow

### Step 1: User Selects File

**Location:** `src/app/admin/fund-details/page.tsx`

```tsx
<input
  ref={fileInputRef}
  type="file"
  accept=".pdf,.xlsx,.xls"
  onChange={handlePdfUpload}
  className="hidden"
/>
```

**Allowed File Types:**
- PDF (`.pdf`)
- Excel (`.xlsx`, `.xls`)

**Max File Size:** 20 MB

---

### Step 2: Request Upload Signature from Server

**Frontend Code:**
```tsx
const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  
  // Validation
  if (!ALLOWED_TYPES.has(file.type)) {
    alert("PDF or Excel files only");
    return;
  }
  
  if (file.size > 20 * 1024 * 1024) {
    alert("Max 20MB");
    return;
  }
  
  // Request signature from server
  const sigRes = await fetch("/api/admin/fund-details/cloudinary-signature", { 
    method: "POST" 
  });
  
  const { signature, timestamp, apiKey, cloudName, folder } = await sigRes.json();
}
```

**API Endpoint:** `POST /api/admin/fund-details/cloudinary-signature`

**Server Response:**
```json
{
  "signature": "abc123...",
  "timestamp": 1234567890,
  "apiKey": "your_cloudinary_key",
  "cloudName": "your_cloud_name",
  "folder": "sifcase/fund-documents",
  "useFilename": true,
  "uniqueFilename": false
}
```

---

### Step 3: Direct Upload to Cloudinary

**Frontend Code:**
```tsx
const fd = new FormData();
fd.append("file", file);
fd.append("api_key", apiKey);
fd.append("timestamp", String(timestamp));
fd.append("signature", signature);
fd.append("folder", folder);
fd.append("use_filename", String(useFilename));
fd.append("unique_filename", String(uniqueFilename));

const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`;

// Upload with progress tracking
const xhr = new XMLHttpRequest();
xhr.open("POST", uploadUrl);

xhr.upload.onprogress = (evt) => {
  if (evt.lengthComputable) {
    setUploadProgress(Math.round((evt.loaded / evt.total) * 100));
  }
};

xhr.onload = () => {
  const result = JSON.parse(xhr.responseText);
  // result.secure_url contains the CDN URL
};

xhr.send(fd);
```

**Why Direct Upload?**
- ✅ **No server load** - Files never touch your Next.js server
- ✅ **Progress tracking** - Real-time upload percentage
- ✅ **Fast** - Direct to CDN, no proxy
- ✅ **Secure** - Server-signed credentials prevent unauthorized uploads

**Cloudinary Response:**
```json
{
  "secure_url": "https://res.cloudinary.com/your-cloud/raw/upload/v123456/sifcase/fund-documents/factsheet.pdf",
  "original_filename": "factsheet.pdf",
  "bytes": 1234567,
  "format": "pdf"
}
```

---

### Step 4: Store File URL in Form State

**Frontend Code:**
```tsx
setForm(prev => ({
  ...prev,
  factsheets: [
    ...prev.factsheets,
    {
      url: result.secure_url,
      filename: file.name,
      documentType: "",  // Admin can select later
      uploadedAt: new Date().toISOString(),
    },
  ],
}));
```

**Document Type Options:**
```typescript
const DOCUMENT_TYPES = [
  "Factsheet",
  "KIM",
  "Excel",
  "XLS - Summary Document",
  "PPT",
];
```

Admin can select document type from dropdown after upload.

---

### Step 5: Admin Can Remove Documents

**Frontend Code:**
```tsx
const removeFactsheet = (idx: number) => {
  setForm(prev => ({ 
    ...prev, 
    factsheets: prev.factsheets.filter((_, i) => i !== idx) 
  }));
};
```

**Note:** This only removes from UI state. Old URLs remain in Cloudinary (no automatic cleanup).

---

### Step 6: Save to Database

**Frontend Code:**
```tsx
const handleSave = async () => {
  const response = await fetch("/api/admin/fund-details/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fundName: selectedFund,
      factsheets: form.factsheets,
      // ... other fields
    }),
  });
};
```

**API Endpoint:** `POST /api/admin/fund-details/save`

**Request Body:**
```json
{
  "fundName": "qsif Equity Long Short Fund",
  "factsheets": [
    {
      "url": "https://res.cloudinary.com/.../factsheet.pdf",
      "filename": "factsheet.pdf",
      "documentType": "Factsheet",
      "uploadedAt": "2026-07-09T12:00:00.000Z"
    }
  ]
}
```

**Database Storage:**
```typescript
// MongoDB FundDetails collection
{
  fundName: "qsif Equity Long Short Fund",
  factsheets: [
    {
      url: "https://...",
      filename: "factsheet.pdf",
      documentType: "Factsheet",
      uploadedAt: ISODate("2026-07-09T12:00:00.000Z")
    }
  ]
}
```

---

## Security Flow

### How Signing Works

1. **Client requests signature** from your server
2. **Server generates signature** using Cloudinary secret key
3. **Client uploads file** with signature to Cloudinary
4. **Cloudinary validates signature** before accepting upload

**Signature Generation (Server-Side):**
```typescript
// src/app/api/admin/fund-details/cloudinary-signature/route.ts
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,  // Secret - never exposed!
});

const timestamp = Math.floor(Date.now() / 1000);

const signature = cloudinary.utils.api_sign_request(
  {
    timestamp,
    folder: "sifcase/fund-documents",
    use_filename: true,
    unique_filename: false,
  },
  process.env.CLOUDINARY_API_SECRET!
);
```

**Why This is Secure:**
- ✅ API Secret never leaves the server
- ✅ Signature is time-limited (expires after ~1 hour)
- ✅ Signature is scoped to specific folder
- ✅ Only authenticated admins can request signatures

---

## Progress Tracking

**Upload Progress UI:**
```tsx
{uploadingPdf && (
  <div className="mt-2">
    <div className="bg-gray-200 rounded-full h-2">
      <div 
        className="bg-blue-500 h-2 rounded-full transition-all"
        style={{ width: `${uploadProgress}%` }}
      />
    </div>
    <p className="text-xs text-gray-600 mt-1">
      Uploading... {uploadProgress}%
    </p>
  </div>
)}
```

**How It Works:**
```tsx
xhr.upload.onprogress = (evt) => {
  if (evt.lengthComputable) {
    const percentage = Math.round((evt.loaded / evt.total) * 100);
    setUploadProgress(percentage);
  }
};
```

---

## Error Handling

### Validation Errors

**Frontend Validation:**
```tsx
// File type check
const ALLOWED_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
]);

if (!ALLOWED_TYPES.has(file.type) && !file.name.match(/\.(pdf|xlsx|xls)$/i)) {
  alert("PDF or Excel files only (.pdf, .xlsx, .xls)");
  return;
}

// File size check
if (file.size > 20 * 1024 * 1024) {
  alert("Max 20MB");
  return;
}
```

### Upload Errors

**Error Handling:**
```tsx
try {
  const result = await uploadToCloudinary();
  // Success
} catch (err) {
  console.error(err);
  alert(err instanceof Error ? err.message : "Upload failed");
} finally {
  setUploadingPdf(false);
  setUploadProgress(0);
  if (fileInputRef.current) fileInputRef.current.value = ""; // Reset input
}
```

**Common Errors:**
- ❌ "Failed to get upload signature" - Server auth issue
- ❌ "Cloudinary upload failed: 401" - Invalid signature
- ❌ "Network error during upload" - Connection lost
- ❌ "Max 20MB" - File too large

---

## Document Types

After upload, admin can select document type:

```tsx
<select
  value={factsheet.documentType}
  onChange={(e) => handleDocumentTypeChange(idx, e.target.value)}
  className="..."
>
  <option value="">Select type...</option>
  <option value="Factsheet">Factsheet</option>
  <option value="KIM">KIM</option>
  <option value="Excel">Excel</option>
  <option value="XLS - Summary Document">XLS - Summary Document</option>
  <option value="PPT">PPT</option>
</select>
```

---

## AI Analysis Integration

**After uploading documents, admin can analyze them with AI:**

```tsx
const handleAnalyse = async () => {
  const response = await fetch("/api/admin/fund-details/analyse", {
    method: "POST",
    body: JSON.stringify({
      fundName: selectedFund,
      files: form.factsheets.map(f => ({ 
        url: f.url, 
        documentType: f.documentType 
      })),
      provider: "deepseek",
      model: "deepseek-chat",
    }),
  });
};
```

**AI extracts:**
- Risk band
- Exit load
- AUM
- Fund managers
- Asset allocation
- Portfolio holdings
- Benchmark details
- Investment limits
- And much more...

See `FUND_DETAILS_AI_ANALYSIS_FLOW.md` for details.

---

## Where Files Are Stored

### Cloudinary CDN

**Folder Structure:**
```
sifcase/
└── fund-documents/
    ├── factsheet-qsif-equity.pdf
    ├── kim-document.pdf
    ├── summary-excel.xlsx
    └── ...
```

**File URLs:**
```
https://res.cloudinary.com/YOUR_CLOUD_NAME/raw/upload/v1234567890/sifcase/fund-documents/filename.pdf
```

### MongoDB Database

**Collection:** `funddetails`

**Document Structure:**
```javascript
{
  _id: ObjectId("..."),
  fundName: "qsif Equity Long Short Fund",
  factsheets: [
    {
      url: "https://res.cloudinary.com/.../factsheet.pdf",
      filename: "factsheet.pdf",
      documentType: "Factsheet",
      uploadedAt: ISODate("2026-07-09T12:00:00.000Z")
    },
    {
      url: "https://res.cloudinary.com/.../kim.pdf",
      filename: "kim.pdf",
      documentType: "KIM",
      uploadedAt: ISODate("2026-07-09T13:00:00.000Z")
    }
  ],
  // ... other fund details
}
```

---

## Environment Variables Required

```bash
# .env.local
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret  # KEEP SECRET!
```

**Security Note:** Only `API_SECRET` must be kept private. The cloud name and API key are safe to expose in client-side code.

---

## Complete Flow Summary

```
1. Admin clicks "Upload Document" button
   ↓
2. File picker opens (PDF/Excel only, max 20MB)
   ↓
3. Admin selects file
   ↓
4. Frontend validates file type and size
   ↓
5. Frontend requests upload signature from server
   POST /api/admin/fund-details/cloudinary-signature
   ↓
6. Server generates signature with Cloudinary secret
   Returns: { signature, timestamp, apiKey, cloudName, folder }
   ↓
7. Frontend uploads file directly to Cloudinary
   POST https://api.cloudinary.com/v1_1/{cloudName}/raw/upload
   (with progress tracking via XHR)
   ↓
8. Cloudinary validates signature and stores file
   Returns: { secure_url, original_filename, bytes, format }
   ↓
9. Frontend adds file to form state
   factsheets: [{ url, filename, documentType: "", uploadedAt }]
   ↓
10. Admin selects document type from dropdown
    ↓
11. (Optional) Admin clicks "Analyse with AI"
    AI extracts data from uploaded documents
    ↓
12. Admin clicks "Save"
    POST /api/admin/fund-details/save
    ↓
13. Server saves fund details + file URLs to MongoDB
    ↓
14. Cache invalidated: revalidateTag("sif-data")
    ↓
15. Success! Document now appears on fund detail pages
```

---

## Cleanup Considerations

**Current Behavior:**
- When a document is removed from the UI and saved, the URL is removed from MongoDB
- The file remains in Cloudinary CDN (no automatic deletion)

**Why?**
- Prevents accidental data loss
- Allows document recovery if needed
- Cloudinary storage is inexpensive

**If you want auto-deletion:**
You'd need to:
1. Track old URLs before update
2. Call Cloudinary Delete API for removed files
3. Handle errors if file is already deleted

---

## Common Use Cases

### 1. Upload Multiple Documents
```tsx
// User can upload multiple files
factsheets: [
  { url: "...", filename: "factsheet.pdf", documentType: "Factsheet" },
  { url: "...", filename: "kim.pdf", documentType: "KIM" },
  { url: "...", filename: "summary.xlsx", documentType: "Excel" },
]
```

### 2. Replace Existing Document
```tsx
// Remove old document
removeFactsheet(0);

// Upload new document
// (Same process as initial upload)
```

### 3. View Documents
```tsx
{form.factsheets.map((f, idx) => (
  <div key={idx}>
    <a href={f.url} target="_blank" rel="noopener">
      {f.filename}
    </a>
    <button onClick={() => removeFactsheet(idx)}>Remove</button>
  </div>
))}
```

---

## Performance Optimizations

✅ **Direct Upload** - No server processing overhead  
✅ **Progress Tracking** - Real-time feedback for users  
✅ **Client-Side Validation** - Fast error detection  
✅ **CDN Delivery** - Fast global access to documents  
✅ **Lazy Loading** - Documents only loaded when needed  

---

## Security Checklist

✅ Admin authentication required (`hasPageAccess`)  
✅ API secret never exposed to client  
✅ Time-limited signatures (1 hour expiry)  
✅ File type validation (client + server)  
✅ File size limits (20 MB)  
✅ Folder scoping (uploads go to specific folder)  
✅ HTTPS only (secure_url)  

---

## Troubleshooting

### Upload Fails with "Failed to get upload signature"
- Check admin authentication
- Verify Cloudinary env variables are set
- Check server logs for errors

### Upload Fails with "Cloudinary upload failed: 401"
- Signature expired (refresh and try again)
- Incorrect API credentials
- Time drift between server and Cloudinary

### Progress Not Showing
- Browser doesn't support XHR progress events
- File size too small (uploads instantly)

### File Shows But Can't Open
- Cloudinary URL incorrect
- File corrupted during upload
- Browser blocking insecure content (HTTP vs HTTPS)

---

## Summary

Your document upload system uses **Cloudinary** as the storage provider with a **secure signed upload** flow:

1. **Client requests signature** from your server (authenticated)
2. **Server signs upload request** using secret key
3. **Client uploads directly** to Cloudinary with progress tracking
4. **Cloudinary returns file URL**
5. **Client saves URL** to MongoDB via your API

This architecture is secure, scalable, and provides excellent UX with progress tracking and fast uploads.
