    # Admin Fund Details - Field Mapping & Data Sources

    ## 📋 Complete Field Reference

    This document maps every field in the Admin Fund Details page to its data source and typical extraction source.

    ---

    ## 🎯 Basic Information

    | Field | Type | Source Document | AI Extraction | Manual Entry | Notes |
    |-------|------|----------------|---------------|--------------|-------|
    | **riskBand** | Number (1-5) | ✅ XLS - Summary Document, Factsheet | ✅ Yes | ✅ Yes | SEBI Riskometer level |
    | **schemeType** | String | ✅ KIM, Factsheet | ✅ Yes | ✅ Yes | e.g., "Hybrid", "Equity" |
    | **exitLoad** | String | ✅ XLS - Summary Document, KIM | ✅ Yes | ✅ Yes | e.g., "1% if redeemed within 1 year" |

    ---

    ## 💰 AUM & Investment Limits

    | Field | Type | Source Document | AI Extraction | Manual Entry | Notes |
    |-------|------|----------------|---------------|--------------|-------|
    | **aumCurrent** | Number | ✅ Excel, XLS - Summary Document | ✅ Yes | ✅ Yes | Current AUM in Crores |
    | **aumAggregate** | Number | ✅ Excel, XLS - Summary Document | ✅ Yes | ✅ Yes | Aggregate AUM |
    | **aumEnd** | Number | ✅ Excel | ✅ Yes | ✅ Yes | AUM at period end |
    | **minInvestment** | Number | ✅ KIM, Factsheet, XLS - Summary Document | ✅ Yes | ✅ Yes | Default: 10,00,000 (10 Lakhs) |
    | **additionalInvestment** | Number | ✅ KIM, XLS - Summary Document | ✅ Yes | ✅ Yes | Default: 10,000 |
    | **accreditedInvestorMinInvestment** | Number | ✅ KIM | ✅ Yes | ✅ Yes | For accredited investors |
    | **panInvestmentThreshold** | String | ✅ KIM | ✅ Yes | ✅ Yes | PAN card requirement threshold |

    ---

    ## 👥 Fund Management

    | Field | Type | Source Document | AI Extraction | Manual Entry | Notes |
    |-------|------|----------------|---------------|--------------|-------|
    | **fundManagers** | Array | ✅ Factsheet, KIM | ✅ Yes | ✅ Yes | Array of manager objects |
    | └─ name | String | ✅ Factsheet | ✅ Yes | ✅ Yes | Manager full name |
    | └─ designation | String | ✅ Factsheet | ✅ Yes | ✅ Yes | e.g., "Fund Manager", "Co-Manager" |
    | └─ experienceYears | String | ✅ Factsheet | ✅ Yes | ✅ Yes | Years of experience |
    | └─ managingSince | String | ✅ Factsheet | ✅ Yes | ✅ Yes | Date started managing fund |

    ---

    ## 📊 Benchmark Information

    | Field | Type | Source Document | AI Extraction | Manual Entry | Notes |
    |-------|------|----------------|---------------|--------------|-------|
    | **benchmarkName** | String | ✅ Factsheet, KIM | ✅ Yes | ✅ Yes | e.g., "Nifty 50 TRI" |
    | **benchmarkRiskBand** | Number (1-5) | ✅ Factsheet | ✅ Yes | ✅ Yes | Benchmark risk level |
    | **benchmarkDetails** | String | ✅ Factsheet | ✅ Yes | ✅ Yes | Additional benchmark info |

    ---

    ## 📈 Asset Allocation

    | Field | Type | Source Document | AI Extraction | Manual Entry | Notes |
    |-------|------|----------------|---------------|--------------|-------|
    | **assetAllocation** | Array | ✅ Factsheet, Excel | ✅ Yes | ✅ Yes | Current allocation breakdown |
    | └─ assetClass | String | ✅ Factsheet | ✅ Yes | ✅ Yes | e.g., "Equity", "Debt", "Gold" |
    | └─ percentage | Number | ✅ Factsheet | ✅ Yes | ✅ Yes | % allocation |
    | **assetAllocationRanges** | Array | ✅ KIM | ✅ Yes | ✅ Yes | Min-max allocation ranges |
    | └─ assetClass | String | ✅ KIM | ✅ Yes | ✅ Yes | Asset class name |
    | └─ min | Number | ✅ KIM | ✅ Yes | ✅ Yes | Minimum % allowed |
    | └─ max | Number | ✅ KIM | ✅ Yes | ✅ Yes | Maximum % allowed |

    ---

    ## 🏭 Portfolio Composition

    | Field | Type | Source Document | AI Extraction | Manual Entry | Notes |
    |-------|------|----------------|---------------|--------------|-------|
    | **portfolioByIndustry** | Array | ✅ Factsheet, Excel | ✅ Yes | ✅ Yes | Industry/sector breakdown |
    | └─ industry | String | ✅ Factsheet | ✅ Yes | ✅ Yes | e.g., "Banking", "IT", "Pharma" |
    | └─ percentage | Number | ✅ Factsheet | ✅ Yes | ✅ Yes | % allocation |
    | **portfolioByRatingClass** | Array | ✅ Factsheet | ✅ Yes | ✅ Yes | Debt rating breakdown |
    | └─ ratingClass | String | ✅ Factsheet | ✅ Yes | ✅ Yes | e.g., "AAA", "AA", "Sovereign" |
    | └─ percentage | Number | ✅ Factsheet | ✅ Yes | ✅ Yes | % allocation |

    ---

    ## 📌 Top Holdings

    | Field | Type | Source Document | AI Extraction | Manual Entry | Notes |
    |-------|------|----------------|---------------|--------------|-------|
    | **topHoldings** | Array | ✅ Factsheet, Excel | ✅ Yes | ✅ Yes | Top 10-15 holdings |
    | └─ name | String | ✅ Factsheet | ✅ Yes | ✅ Yes | Security/company name |
    | └─ percentage | Number | ✅ Factsheet | ✅ Yes | ✅ Yes | % of portfolio |
    | └─ sector | String | ✅ Factsheet | ✅ Yes | ✅ Yes | Industry sector |
    | └─ rating | String | ✅ Factsheet | ✅ Yes | ✅ Yes | Credit rating (for debt) |

    ---

    ## 📄 Document Uploads

    | Field | Type | Source Document | AI Extraction | Manual Entry | Notes |
    |-------|------|----------------|---------------|--------------|-------|
    | **factsheets** | Array | ❌ Upload | ❌ No | ✅ Yes | PDF uploads |
    | └─ url | String | - | - | Auto | Blob storage URL |
    | └─ filename | String | - | - | Auto | Original filename |
    | └─ documentType | String | - | ❌ No | ✅ Yes | Dropdown: Factsheet, KIM, Excel, XLS - Summary Document, PPT |
    | └─ uploadedAt | Date | - | - | Auto | Upload timestamp |

    ---

    ## 🏗️ Fund Structure

    | Field | Type | Source Document | AI Extraction | Manual Entry | Notes |
    |-------|------|----------------|---------------|--------------|-------|
    | **schemeCategory** | String | ✅ KIM | ✅ Yes | ✅ Yes | e.g., "Equity SIF", "Hybrid SIF" |
    | **schemeNature** | String | ✅ KIM | ✅ Yes | ✅ Yes | e.g., "Open-Ended" |
    | **inceptionDate** | String | ✅ KIM, Factsheet | ✅ Yes | ✅ Yes | Fund launch date |
    | **planCodes** | Array | ✅ KIM | ✅ Yes | ✅ Yes | All plan variants |
    | └─ planName | String | ✅ KIM | ✅ Yes | ✅ Yes | e.g., "Direct-Growth", "Regular-IDCW" |
    | └─ isin | String | ✅ KIM | ✅ Yes | ✅ Yes | ISIN code |

    ---

    ## 🔄 Redemption & Liquidity

    | Field | Type | Source Document | AI Extraction | Manual Entry | Notes |
    |-------|------|----------------|---------------|--------------|-------|
    | **redemptionFrequency** | String | ✅ KIM | ✅ Yes | ✅ Yes | e.g., "Daily", "Weekly" |
    | **navCutoffTime** | String | ✅ KIM | ✅ Yes | ✅ Yes | e.g., "3:00 PM" |
    | **redemptionPayoutDays** | String | ✅ KIM | ✅ Yes | ✅ Yes | e.g., "T+3 days" |
    | **redemptionNoticePeriod** | String | ✅ KIM | ✅ Yes | ✅ Yes | Notice period for redemption |
    | **penalInterestRate** | String | ✅ KIM | ✅ Yes | ✅ Yes | Early redemption penalty |

    ---

    ## 💳 SIP Details

    | Field | Type | Source Document | AI Extraction | Manual Entry | Notes |
    |-------|------|----------------|---------------|--------------|-------|
    | **sipDetails** | Array | ✅ KIM | ✅ Yes | ✅ Yes | SIP options |
    | └─ frequency | String | ✅ KIM | ✅ Yes | ✅ Yes | e.g., "Monthly", "Quarterly" |
    | └─ minAmount | Number | ✅ KIM | ✅ Yes | ✅ Yes | Minimum SIP amount |
    | └─ minInstallments | Number | ✅ KIM | ✅ Yes | ✅ Yes | Minimum number of installments |

    ---

    ## 💵 Expenses & Fees

    | Field | Type | Source Document | AI Extraction | Manual Entry | Notes |
    |-------|------|----------------|---------------|--------------|-------|
    | **terMax** | String | ✅ KIM, XLS - Summary Document | ✅ Yes | ✅ Yes | Maximum TER % |
    | **terSlabs** | Array | ✅ KIM | ✅ Yes | ✅ Yes | TER based on AUM slabs |
    | └─ aumSlab | String | ✅ KIM | ✅ Yes | ✅ Yes | e.g., "First 500 Cr", "Above 2000 Cr" |
    | └─ ter | String | ✅ KIM | ✅ Yes | ✅ Yes | TER % for that slab |
    | **taxationSummary** | String | ✅ KIM | ✅ Yes | ✅ Yes | Tax treatment summary |

    ---

    ## 📐 Derivatives & Risk Controls

    | Field | Type | Source Document | AI Extraction | Manual Entry | Notes |
    |-------|------|----------------|---------------|--------------|-------|
    | **grossExposureLimit** | String | ✅ KIM | ✅ Yes | ✅ Yes | Max gross exposure % |
    | **derivativesRestrictions** | String | ✅ KIM | ✅ Yes | ✅ Yes | Derivative usage rules |
    | **derivativeStrategies** | Array | ✅ KIM, PPT | ✅ Yes | ✅ Yes | Derivative strategies used |
    | └─ name | String | ✅ KIM | ✅ Yes | ✅ Yes | Strategy name |
    | └─ description | String | ✅ KIM | ✅ Yes | ✅ Yes | How it's used |

    ---

    ## 🎯 Strategy & Alpha Generation

    | Field | Type | Source Document | AI Extraction | Manual Entry | Notes |
    |-------|------|----------------|---------------|--------------|-------|
    | **alphaGenerationApproach** | String | ✅ KIM, PPT | ✅ Yes | ✅ Yes | How fund generates alpha |

    ---

    ## 🏢 Fund Administration

    | Field | Type | Source Document | AI Extraction | Manual Entry | Notes |
    |-------|------|----------------|---------------|--------------|-------|
    | **sponsorName** | String | ✅ KIM | ✅ Yes | ✅ Yes | Sponsor entity |
    | **amcName** | String | ✅ KIM, Factsheet | ✅ Yes | ✅ Yes | AMC name |
    | **trusteeName** | String | ✅ KIM | ✅ Yes | ✅ Yes | Trustee company |
    | **registrarName** | String | ✅ KIM | ✅ Yes | ✅ Yes | R&T agent |

    ---

    ## 🎯 Investor Suitability

    | Field | Type | Source Document | AI Extraction | Manual Entry | Notes |
    |-------|------|----------------|---------------|--------------|-------|
    | **suitableFor** | String (Long) | ✅ KIM, Factsheet | ✅ Yes | ✅ Yes | Who should invest |
    | **notSuitableFor** | String (Long) | ✅ KIM, Factsheet | ✅ Yes | ✅ Yes | Who should avoid |

    ---

    ## 📊 Market Scenario Analysis

    | Field | Type | Source Document | AI Extraction | Manual Entry | Notes |
    |-------|------|----------------|---------------|--------------|-------|
    | **bullMarket** | String (Long) | ✅ PPT, KIM | ✅ Yes | ✅ Yes | Performance in rising markets |
    | **bearMarket** | String (Long) | ✅ PPT, KIM | ✅ Yes | ✅ Yes | Performance in falling markets |
    | **sidewaysMarket** | String (Long) | ✅ PPT, KIM | ✅ Yes | ✅ Yes | Performance in flat markets |

    ---

    ## 🎓 Fund Fit & Strategy

    | Field | Type | Source Document | AI Extraction | Manual Entry | Notes |
    |-------|------|----------------|---------------|--------------|-------|
    | **howItWorks** | String (Long) | ✅ PPT, KIM | ✅ Yes | ✅ Yes | Strategy explanation |
    | **mfEquivalent** | String (Long) | ✅ Manual Analysis | ❌ No | ✅ Yes | Comparable mutual fund category |
    | **portfolioFit** | String (Long) | ✅ Manual Analysis | ❌ No | ✅ Yes | Where it fits in portfolio |

    ---

    ## 📝 Document Type Priority Guide

    ### XLS - Summary Document (Excel)
    **Best For:**
    - ✅ Risk Band
    - ✅ Exit Load
    - ✅ AUM figures
    - ✅ Minimum Investment
    - ✅ TER (max)

    ### Factsheet (PDF)
    **Best For:**
    - ✅ Fund Manager details
    - ✅ Asset Allocation (current)
    - ✅ Top Holdings
    - ✅ Portfolio by Industry
    - ✅ Portfolio by Rating
    - ✅ Benchmark Name
    - ✅ Performance data

    ### KIM (Key Information Memorandum)
    **Best For:**
    - ✅ Scheme Type
    - ✅ Fund Structure (category, nature, inception)
    - ✅ All plan codes & ISINs
    - ✅ Redemption rules
    - ✅ SIP details
    - ✅ TER slabs
    - ✅ Asset Allocation Ranges
    - ✅ Derivatives restrictions
    - ✅ Fund Administration details
    - ✅ Investor Suitability
    - ✅ Taxation

    ### PPT (Presentation)
    **Best For:**
    - ✅ Strategy explanation
    - ✅ Market scenario analysis
    - ✅ How it works
    - ✅ Alpha generation approach

    ### Excel (Detailed)
    **Best For:**
    - ✅ AUM breakdown
    - ✅ Detailed portfolio holdings
    - ✅ Historical performance data

    ---

    ## 🤖 AI Extraction Status

    | Category | Fields | AI Can Extract | Manual Required |
    |----------|--------|----------------|-----------------|
    | **Basic Info** | 3 | ✅ All 3 | Optional |
    | **AUM & Limits** | 7 | ✅ All 7 | Optional |
    | **Fund Management** | 4 sub-fields | ✅ All 4 | Optional |
    | **Benchmark** | 3 | ✅ All 3 | Optional |
    | **Asset Allocation** | 2 arrays | ✅ Both | Optional |
    | **Portfolio Composition** | 2 arrays | ✅ Both | Optional |
    | **Top Holdings** | 4 sub-fields | ✅ All 4 | Optional |
    | **Documents** | Upload only | ❌ Not AI | ✅ Required |
    | **Fund Structure** | 4 + array | ✅ All | Optional |
    | **Redemption** | 5 | ✅ All 5 | Optional |
    | **SIP Details** | 3 sub-fields | ✅ All 3 | Optional |
    | **Expenses** | 3 + array | ✅ All | Optional |
    | **Derivatives** | 2 + array | ✅ All | Optional |
    | **Strategy** | 1 | ✅ Yes | Optional |
    | **Administration** | 4 | ✅ All 4 | Optional |
    | **Suitability** | 2 | ✅ Both | Optional |
    | **Market Scenarios** | 3 | ✅ All 3 | Optional |
    | **Fund Fit** | 3 | ❌ 2 Manual, ✅ 1 AI | ✅ mfEquivalent, portfolioFit |

    ---

    ## 🔄 Workflow Summary

    1. **Upload Documents** → Upload PDFs (Factsheet, KIM, Excel, PPT)
    2. **Tag Document Types** → Select from dropdown for each file
    3. **AI Analysis** → Click "Analyse" to extract all fields
    4. **Review AI Results** → AI shows extracted values with "Apply" buttons
    5. **Apply Fields** → Click individual "Apply" or "Apply All"
    6. **Manual Adjustments** → Edit any fields as needed
    7. **Save** → All changes saved to MongoDB, cache invalidated, frontend updated immediately

    ---

    ## 💡 Key Notes

    - **Total Fields**: 54 main fields (+ sub-fields in arrays)
    - **AI Extractable**: ~90% of fields
    - **Manual Entry Required**: Document uploads, mfEquivalent, portfolioFit
    - **Most Important Document**: **XLS - Summary Document** for quick basic data
    - **Most Comprehensive**: **KIM** for complete fund details
    - **Best for Holdings**: **Factsheet** for current portfolio

    ---

    ## ✅ Field Validation

    Fields with validation/defaults:
    - `riskBand`: 1-5 only
    - `benchmarkRiskBand`: 1-5 only
    - `minInvestment`: Default 10,00,000 (10 Lakhs)
    - `additionalInvestment`: Default 10,000
    - All percentage fields: 0-100
    - All number fields: Must be positive

    ---

    ## 🎯 Frontend Display

    All saved fields automatically appear on:
    - `/sifs/[code]` - Individual fund pages
    - `/sifs` - Fund listing (basic info only)
    - `/fund-house/[slug]` - Fund house pages
    - `/compare` - Comparison tool

    Data is cached for 2 hours, invalidated immediately on save.
