# Frontend Workflow Guide - Loknidhi Government Fund Tracking System

## 🎯 Overview

This guide outlines the complete frontend workflow for integrating with the Loknidhi backend API, which tracks government fund flows with **automatic nodal agency integration**.

---

## 📋 Table of Contents

1. [Backend Architecture Summary](#backend-architecture-summary)
2. [API Endpoints Reference](#api-endpoints-reference)
3. [Frontend Workflow by Module](#frontend-workflow-by-module)
4. [Automatic Nodal Agency Integration](#automatic-nodal-agency-integration)
5. [Data Flow Diagrams](#data-flow-diagrams)
6. [Component Architecture](#component-architecture)
7. [State Management](#state-management)
8. [Error Handling](#error-handling)
9. [Real-time Updates](#real-time-updates)

---

## 🏗️ Backend Architecture Summary

### Database

- **Firebase Firestore**: Primary database (lokniti-66d58)
- **In-memory fallback**: For development/testing
- Collections: `schemes`, `fund_flows`, `nodal_agencies`, `utilization`, `anomalies`, `predictions`

### Key Features

- ✅ **11 Modules** with **26 API endpoints**
- ✅ **Automatic Nodal Agency Integration** (when status="credited" AND to_level="State")
- ✅ Real-time fund flow tracking
- ✅ Multi-level government hierarchy (National → State → District → Department)
- ✅ PFMS integration ready

---

## 🔌 API Endpoints Reference

### Base URL

```
http://127.0.0.1:8000/api/v1
```

### Module 1: Scheme Management

#### 1.1 Create Scheme

```http
POST /schemes/?created_by={username}
Content-Type: application/json

{
  "scheme_code": "PMJAY-2024",
  "name": "Pradhan Mantri Jan Arogya Yojana",
  "name_hindi": "प्रधानमंत्री जन आरोग्य योजना",
  "description": "Health insurance scheme",
  "ministry": "Ministry of Health and Family Welfare",
  "state_nodal_agency": "State Health Authority",
  "budget_allocated": 50000000000.0,
  "fiscal_year": 2024,
  "budget_financial_year": "2024-2025",
  "scheme_type": "Health",
  "target_beneficiaries": 100000000,
  "beneficiary_category": "BPL",
  "launch_date": "2024-04-01T00:00:00",
  "status": "active",
  "priority": "high",
  "coverage_states": ["Maharashtra", "Karnataka", "Tamil Nadu"],
  "coverage_type": "National",
  "pfms_scheme_code": "PFMS-PMJAY-2024"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Scheme created successfully",
  "scheme": {
    "document_id": "abc123xyz",
    "scheme_code": "PMJAY-2024",
    "name": "Pradhan Mantri Jan Arogya Yojana",
    ...
  }
}
```

#### 1.2 List Schemes with Filters

```http
GET /schemes/?ministry={ministry}&status={status}&fiscal_year={year}&scheme_type={type}
```

**Response:**

```json
{
  "success": true,
  "total": 5,
  "skip": 0,
  "limit": 100,
  "schemes": [...]
}
```

#### 1.3 Get Scheme Details

```http
GET /schemes/{scheme_code}
```

---

### Module 2: Fund Flow Tracking (with Auto-Integration)

#### 2.1 Track Fund Movement ⚡ **AUTO-INTEGRATION ENABLED**

```http
POST /funds/track
Content-Type: application/json

{
  "scheme_id": "Etxptk0L5jbl7I2xI9kb",  // Firebase document_id
  "fund_flow_reference": "FF-2024-001",
  "from_level": "National",
  "to_level": "State",
  "from_entity_code": "MIN-HEALTH",
  "to_entity_code": "MH-HEALTH",
  "from_entity_name": "Ministry of Health",
  "to_entity_name": "Maharashtra Health Department",
  "amount": 5000000000.0,
  "currency": "INR",
  "pfms_mandate_id": "MAN-001",
  "pfms_transaction_id": "TXN-001",
  "pfms_status": "PAYMENT_SUCCESS",
  "from_account_number": "RBI-CENTRAL",
  "to_account_number": "MH-TREASURY",
  "to_ifsc_code": "SBIN0001234",
  "payment_mode": "RTGS",
  "utr_number": "UTR-123456",
  "sanction_date": "2024-03-01T00:00:00",
  "transfer_date": "2024-03-05T10:00:00",
  "credited_date": "2024-03-05T14:00:00",
  "status": "credited",                    // ⚡ TRIGGERS AUTO-INTEGRATION
  "installment_number": 1,
  "total_installments": 3,
  "release_type": "FIRST_INSTALLMENT"
}
```

**Response (with Auto-Integration):**

```json
{
  "id": 1,
  "document_id": "xyz789abc",
  "scheme_id": "Etxptk0L5jbl7I2xI9kb",
  "amount": 5000000000.0,
  "status": "credited",
  "created_at": "2024-03-05T14:00:00",

  // ⚡ AUTO-INTEGRATION FIELDS
  "nodal_agency_updated": true, // ✅ Automatic update successful
  "nodal_agency_id": "1", // Created/Updated agency ID
  "nodal_agency_error": null // Error if failed
}
```

#### 2.2 Get Fund Flow Path

```http
GET /funds/scheme/{scheme_id}/flow
```

Returns complete flow: Central → State → District → Department

#### 2.3 Calculate Total Transferred

```http
GET /funds/scheme/{scheme_id}/total-transferred
```

#### 2.4 Status Distribution

```http
GET /funds/scheme/{scheme_id}/status-distribution
```

Returns breakdown by status: sanctioned, transferred, credited, failed

#### 2.5 Detect Bottlenecks

```http
GET /funds/scheme/{scheme_id}/bottlenecks
```

---

### Module 3-11: Additional Endpoints

**Module 3: Utilization Monitoring**

- `POST /utilization/submit` - Submit utilization certificate
- `GET /utilization/scheme/{scheme_id}` - Get utilization data
- `GET /utilization/overdue` - Get overdue UCs

**Module 4: Nodal Agency Monitoring**

- `POST /nodal-agencies/register` - Register nodal agency
- `GET /nodal-agencies/scheme/{scheme_id}` - Get agencies by scheme
- `GET /nodal-agencies/idle-funds` - Detect idle funds
- `POST /nodal-agencies/{agency_id}/flag` - Flag for investigation

**Module 5: Anomaly Detection**

- `POST /anomalies/detect` - Detect anomaly
- `GET /anomalies/scheme/{scheme_id}` - Get scheme anomalies
- `GET /anomalies/critical` - Get critical alerts

**Module 6: Predictive Analytics**

- `POST /predictions/fund-lapse` - Predict fund lapse
- `GET /predictions/scheme/{scheme_id}/risk` - Get risk score

**Module 7: Budget Reallocation**

- `POST /reallocation/suggest` - Suggest reallocation
- `GET /reallocation/pending` - Get pending suggestions

**Module 8: Beneficiary Payment Tracking**

- `POST /beneficiaries/payment` - Track DBT payment
- `GET /beneficiaries/scheme/{scheme_id}/summary` - Payment summary
- `GET /beneficiaries/failed` - Get failed payments

**Module 9: Convergence Detection**

- `POST /convergence/detect` - Detect scheme overlap
- `GET /convergence/scheme/{scheme_id}` - Get convergence data

**Module 10: Outcome Monitoring**

- `POST /outcomes/report` - Report scheme outcome
- `GET /outcomes/scheme/{scheme_id}` - Get outcome metrics

**Module 11: State-Specific Filters**

- `GET /schemes/state/{state_code}` - Get state schemes
- `GET /funds/state/{state_code}/summary` - State fund summary

---

## 🎨 Frontend Workflow by Module

### 1️⃣ Scheme Management Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                    SCHEME MANAGEMENT UI                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  📋 List View                                                │
│  ┌───────────────────────────────────────────────────┐     │
│  │ [Filter: Ministry ▼] [Status ▼] [Year ▼] [Type ▼] │     │
│  │                                         [+ Create] │     │
│  ├───────────────────────────────────────────────────┤     │
│  │ PMJAY-2024  │ Health │ Active  │ ₹500 Cr │ View   │     │
│  │ MGNREGA-24  │ Rural  │ Active  │ ₹800 Cr │ View   │     │
│  └───────────────────────────────────────────────────┘     │
│                                                              │
│  📝 Create/Edit Form                                         │
│  ┌───────────────────────────────────────────────────┐     │
│  │ Scheme Code:    [PMJAY-2024________________]       │     │
│  │ Name (English): [Pradhan Mantri...________]       │     │
│  │ Name (Hindi):   [प्रधानमंत्री...___________]       │     │
│  │ Ministry:       [Ministry of Health ▼]            │     │
│  │ Budget:         [₹ 50,000,000,000.00_____]        │     │
│  │ Fiscal Year:    [2024-2025 ▼]                     │     │
│  │                                                    │     │
│  │              [Cancel]  [Save Scheme]              │     │
│  └───────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

**Frontend Actions:**

1. **List Schemes**: `GET /schemes/` with filters
2. **View Details**: `GET /schemes/{scheme_code}`
3. **Create**: `POST /schemes/?created_by={user}`
4. **Search/Filter**: Client-side or server-side filtering

**State Management:**

```typescript
interface SchemeState {
  schemes: Scheme[];
  currentScheme: Scheme | null;
  filters: {
    ministry?: string;
    status?: string;
    fiscal_year?: number;
    scheme_type?: string;
  };
  loading: boolean;
  error: string | null;
}
```

---

### 2️⃣ Fund Flow Tracking Workflow ⚡

```
┌──────────────────────────────────────────────────────────────────┐
│                 FUND FLOW TRACKING DASHBOARD                    │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Step 1: Select Scheme                                           │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ Scheme: [PMJAY-2024 ▼]                                  │    │
│  │ Budget: ₹500 Cr  │  Transferred: ₹350 Cr (70%)         │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Step 2: Initiate Fund Transfer                                 │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ From Level:     [National ▼]                            │    │
│  │ From Entity:    [Ministry of Health_______________]     │    │
│  │ To Level:       [State ▼]    ← ⚡ AUTO-INTEGRATION     │    │
│  │ To Entity:      [Maharashtra Health Dept_________]     │    │
│  │                                                          │    │
│  │ Amount:         [₹ 5,000,000,000.00______________]      │    │
│  │ Payment Mode:   [RTGS ▼]                                │    │
│  │ UTR Number:     [UTR-123456__________________]          │    │
│  │                                                          │    │
│  │ Status: ⚪ Sanctioned  ⚪ Transferred  🟢 Credited      │    │
│  │                                                          │    │
│  │                        [Submit Transfer]                │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Step 3: Auto-Integration Result ✅                             │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ ✅ Fund Transfer Successful!                            │    │
│  │                                                          │    │
│  │ Transfer Details:                                        │    │
│  │ • Fund Flow ID: xyz789abc                               │    │
│  │ • Amount: ₹500 Crore                                     │    │
│  │ • Status: Credited                                       │    │
│  │                                                          │    │
│  │ ⚡ AUTOMATIC NODAL AGENCY UPDATE:                       │    │
│  │ • Nodal Agency ID: 1                                     │    │
│  │ • Updated Balance: ₹500 Crore                            │    │
│  │ • Agency: Maharashtra Health Dept - Nodal Agency        │    │
│  │                                                          │    │
│  │                         [View Details]                   │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Fund Flow Visualization 📊                                     │
│  ┌────────────────────────────────────────────────────────┐    │
│  │                                                          │    │
│  │   [Central]  ──₹500Cr──▶  [State]  ──₹300Cr──▶ [Dist]  │    │
│  │   Ministry              Maharashtra           Mumbai     │    │
│  │   (Sanctioned)          (Credited ✅)         (Pending)  │    │
│  │                              ↓                            │    │
│  │                         [Nodal Agency] ⚡                 │    │
│  │                         Balance: ₹500Cr                   │    │
│  │                                                          │    │
│  └────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
```

**Frontend Logic Flow:**

```typescript
async function trackFundMovement(data: FundFlowRequest) {
  try {
    // 1. Submit fund flow
    const response = await api.post("/funds/track", data);

    // 2. Check auto-integration status
    if (response.nodal_agency_updated) {
      // ✅ Success: Show automatic update notification
      showNotification({
        type: "success",
        title: "Fund Transfer Successful",
        message: `Nodal Agency ${response.nodal_agency_id} automatically updated with ₹${formatCurrency(response.amount)}`,
        autoIntegration: true,
      });

      // Update nodal agency list in background
      refreshNodalAgencies(data.scheme_id);
    } else {
      // ⚠️ Check if error occurred
      if (response.nodal_agency_error) {
        showWarning({
          title: "Auto-integration Failed",
          message: response.nodal_agency_error,
          action: "Manual Update Required",
        });
      }
    }

    // 3. Update fund flow visualization
    refreshFundFlowChart(data.scheme_id);
  } catch (error) {
    handleError(error);
  }
}
```

**Key UI Components:**

1. **FundFlowForm.tsx**
   - Form to initiate fund transfers
   - Real-time validation
   - Status selector (sanctioned/transferred/credited)
   - Auto-integration indicator when to_level="State"

2. **FundFlowVisualization.tsx**
   - Interactive Sankey diagram or flow chart
   - Show flow: Central → State → District → Department
   - Highlight credited vs pending transfers
   - Show nodal agency connections

3. **AutoIntegrationIndicator.tsx**
   - Shows when auto-integration will trigger
   - Real-time status: "Will auto-create nodal agency ⚡"
   - Success notification with agency details

4. **BottleneckAlert.tsx**
   - Detect transfers > 30 days old
   - Alert for stuck funds
   - Suggest actions

---

### 3️⃣ Nodal Agency Monitoring Workflow

```
┌──────────────────────────────────────────────────────────────────┐
│              NODAL AGENCY MONITORING DASHBOARD                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Agency List (Auto-Created by System ⚡)                         │
│  ┌────────────────────────────────────────────────────────┐    │
│  │                                                          │    │
│  │  Agency Name                   Balance    Status   🔍   │    │
│  │  ────────────────────────────────────────────────────  │    │
│  │  MH Health Dept - Nodal ⚡    ₹750 Cr   Active    [→]  │    │
│  │  (Auto-created: 2024-03-05)                            │    │
│  │                                                          │    │
│  │  KA Health Dept - Nodal ⚡    ₹500 Cr   Active    [→]  │    │
│  │  (Auto-created: 2024-03-06)                            │    │
│  │                                                          │    │
│  │  TN Health Dept - Nodal       ₹100 Cr   Idle ⚠️   [→]  │    │
│  │  (Idle for 45 days)                                     │    │
│  │                                                          │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Agency Details View                                             │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ Agency: Maharashtra Health Dept - Nodal Agency ⚡       │    │
│  │ Account: NA-MH-HEALTH-Etxptk0L5jbl7I2xI9kb              │    │
│  │ IFSC: SBIN0001234                                        │    │
│  │                                                          │    │
│  │ Balance Information:                                     │    │
│  │ • Current Balance:    ₹750 Crore                         │    │
│  │ • Opening Balance:    ₹0                                 │    │
│  │ • Last Credit:        ₹750 Cr (2024-03-06)              │    │
│  │ • Last Debit:         -                                  │    │
│  │                                                          │    │
│  │ Transaction History:                                     │    │
│  │ 2024-03-06 14:30  Credit  ₹750 Cr  FF-2024-002         │    │
│  │ 2024-03-05 16:45  Credit  ₹500 Cr  FF-2024-001         │    │
│  │                                                          │    │
│  │ ⚡ Auto-Created from Fund Flow: FF-2024-001             │    │
│  │                                                          │    │
│  └────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
```

**Frontend Implementation:**

```typescript
interface NodalAgencyState {
  agencies: NodalAgency[];
  autoCreatedAgencies: string[]; // Track auto-created IDs
  idleFunds: IdleFundAlert[];
  loading: boolean;
}

// Listen for new fund flows and refresh agencies
useEffect(() => {
  const unsubscribe = subscribeFundFlowUpdates((fundFlow) => {
    if (fundFlow.nodal_agency_updated) {
      // New agency auto-created, refresh list
      fetchNodalAgencies();

      // Show notification
      toast.success(`New nodal agency created for ${fundFlow.to_entity_name}`, {
        autoClose: 5000,
      });
    }
  });

  return unsubscribe;
}, []);
```

---

### 4️⃣ Utilization Certificate Workflow

```
┌──────────────────────────────────────────────────────────────────┐
│            UTILIZATION CERTIFICATE SUBMISSION                   │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Step 1: Select Fund Flow                                        │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ Scheme: [PMJAY-2024 ▼]                                  │    │
│  │                                                          │    │
│  │ Fund Flows Available for UC:                            │    │
│  │ • FF-2024-001  ₹500 Cr  Credited  [Select]             │    │
│  │ • FF-2024-002  ₹300 Cr  Credited  [Select]             │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Step 2: Submit Utilization Certificate                         │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ UC Number:           [UC-2024-MH-001__________]         │    │
│  │ Amount Utilized:     [₹ 450,000,000.00_______]          │    │
│  │ Actual Beneficiaries: [95,000_________________]         │    │
│  │ Reporting Period:    [2024-03-01] to [2024-03-31]      │    │
│  │                                                          │    │
│  │ Upload Documents:                                        │    │
│  │ 📄 audit_report.pdf (2.3 MB)              [✓]          │    │
│  │ 📄 beneficiary_list.xlsx (1.8 MB)         [✓]          │    │
│  │                                [+ Add More Files]       │    │
│  │                                                          │    │
│  │              [Cancel]  [Submit UC]                      │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Overdue UC Alerts 🚨                                            │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ FF-2024-003  │ ₹200 Cr │ Overdue by 15 days  │ [Submit] │    │
│  └────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
```

---

### 5️⃣ Analytics Dashboard

```
┌──────────────────────────────────────────────────────────────────┐
│                    ANALYTICS DASHBOARD                          │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Key Performance Indicators                                      │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌──────────┐ │
│  │ Total Budget│ │  Transferred│ │   Utilized  │ │ Anomalies│ │
│  │  ₹5,000 Cr │ │  ₹3,500 Cr │ │  ₹2,800 Cr │ │    12    │ │
│  │             │ │    (70%)    │ │    (80%)    │ │          │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └──────────┘ │
│                                                                  │
│  Fund Flow Status Distribution 📊                                │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Sanctioned  ████████░░░░░░░░░░  40%                   │    │
│  │  Transferred ██████████████░░░░  70%                   │    │
│  │  Credited    ███████████████████ 95%                   │    │
│  │  Utilized    ██████████░░░░░░░░░ 56%                   │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Bottlenecks Detection 🔴                                        │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ • FF-2024-045: Stuck at State level for 42 days        │    │
│  │ • FF-2024-023: District approval pending 35 days       │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Nodal Agency Auto-Integration Stats ⚡                          │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ • Total Auto-Created: 24 agencies                       │    │
│  │ • Success Rate: 98.5%                                    │    │
│  │ • Latest: Karnataka Health Dept (2 mins ago)           │    │
│  └────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
```

---

## ⚡ Automatic Nodal Agency Integration

### How It Works

**Trigger Conditions:**

```javascript
if (fundFlow.status === "credited" && fundFlow.to_level === "State") {
  // ⚡ AUTOMATIC INTEGRATION TRIGGERED
  // 1. Check if nodal agency exists for this state + scheme
  // 2. If not found, create new nodal agency
  // 3. Update agency balance with credited amount
  // 4. Return confirmation in API response
}
```

### Frontend Handling

**1. Show Auto-Integration Indicator**

```tsx
{
  formData.to_level === "State" && formData.status === "credited" && (
    <Alert severity="info" icon={<FlashOn />}>
      ⚡ Automatic Integration: Nodal agency will be auto-created/updated
    </Alert>
  );
}
```

**2. Handle Response**

```typescript
const handleSubmit = async (data: FundFlowRequest) => {
  const response = await trackFundMovement(data);

  if (response.nodal_agency_updated) {
    // Success notification
    showNotification({
      title: "✅ Auto-Integration Successful",
      message: `Nodal Agency ${response.nodal_agency_id} updated`,
      details: `Balance credited: ₹${formatMoney(response.amount)}`,
      type: "success",
    });

    // Navigate to nodal agency details
    router.push(`/nodal-agencies/${response.nodal_agency_id}`);
  } else if (response.nodal_agency_error) {
    // Error notification
    showNotification({
      title: "⚠️ Auto-Integration Failed",
      message: response.nodal_agency_error,
      action: "Manual Update Required",
      type: "warning",
    });
  }
};
```

**3. Real-time Updates**

```typescript
// Subscribe to nodal agency updates
useEffect(() => {
  const unsubscribe = db
    .collection("nodal_agencies")
    .where("scheme_id", "==", currentScheme.document_id)
    .onSnapshot((snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          // New nodal agency auto-created
          toast.success(
            `⚡ New nodal agency: ${change.doc.data().agency_name}`,
            { duration: 5000 },
          );
        }
        if (change.type === "modified") {
          // Agency balance updated
          toast.info(
            `💰 Agency balance updated: ₹${change.doc.data().current_balance}`,
            { duration: 3000 },
          );
        }
      });
    });

  return unsubscribe;
}, [currentScheme]);
```

---

## 🎨 Component Architecture

### Recommended Component Tree

```
App
├── Layout
│   ├── Navbar
│   │   ├── UserProfile
│   │   └── NotificationBell
│   └── Sidebar
│       ├── SchemeManagement
│       ├── FundFlowTracking
│       ├── NodalAgencies
│       ├── Utilization
│       └── Analytics
│
├── Pages
│   ├── Dashboard
│   │   ├── KPICards
│   │   ├── FundFlowChart
│   │   ├── BottleneckAlerts
│   │   └── RecentActivity
│   │
│   ├── SchemeManagement
│   │   ├── SchemeList
│   │   ├── SchemeDetail
│   │   ├── SchemeForm
│   │   └── SchemeFilters
│   │
│   ├── FundFlowTracking
│   │   ├── FundFlowForm ⚡
│   │   │   ├── AutoIntegrationIndicator
│   │   │   └── StatusSelector
│   │   ├── FundFlowList
│   │   ├── FundFlowVisualization
│   │   │   ├── SankeyDiagram
│   │   │   └── FlowTimeline
│   │   └── BottleneckDetector
│   │
│   ├── NodalAgencyMonitoring
│   │   ├── AgencyList
│   │   │   ├── AutoCreatedBadge ⚡
│   │   │   └── IdleAlert
│   │   ├── AgencyDetail
│   │   │   ├── BalanceCard
│   │   │   ├── TransactionHistory
│   │   │   └── LinkedFundFlows
│   │   └── IdleFundsAlert
│   │
│   ├── UtilizationCertificate
│   │   ├── UCSubmissionForm
│   │   ├── UCList
│   │   ├── OverdueAlerts
│   │   └── UCVerification
│   │
│   └── Analytics
│       ├── FundStatusDistribution
│       ├── StateWiseAllocation
│       ├── AnomalyHeatmap
│       └── PredictiveAnalytics
│
└── Shared Components
    ├── AutoIntegrationStatus ⚡
    ├── CurrencyInput
    ├── DateRangePicker
    ├── FileUpload
    ├── ConfirmDialog
    └── Toast/Notification
```

---

## 🗂️ State Management

### Redux/Zustand Store Structure

```typescript
// store/index.ts
interface AppState {
  // Schemes
  schemes: {
    list: Scheme[];
    current: Scheme | null;
    filters: SchemeFilters;
    loading: boolean;
    error: string | null;
  };

  // Fund Flows
  fundFlows: {
    list: FundFlow[];
    current: FundFlow | null;
    autoIntegrationStatus: {
      enabled: boolean;
      lastUpdate: string;
      stats: {
        totalAutoCreated: number;
        successRate: number;
      };
    };
    bottlenecks: Bottleneck[];
    loading: boolean;
  };

  // Nodal Agencies
  nodalAgencies: {
    list: NodalAgency[];
    autoCreated: string[]; // Track auto-created agency IDs
    idleFunds: IdleFundAlert[];
    loading: boolean;
  };

  // Utilization
  utilization: {
    certificates: UC[];
    overdue: OverdueUC[];
    loading: boolean;
  };

  // Analytics
  analytics: {
    kpi: KPIData;
    statusDistribution: StatusDistribution;
    loading: boolean;
  };

  // UI
  ui: {
    sidebarOpen: boolean;
    notifications: Notification[];
    activeModal: string | null;
  };
}
```

### API Client

```typescript
// api/client.ts
import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

// Schemes
export const schemeAPI = {
  list: (filters?: SchemeFilters) => api.get("/schemes/", { params: filters }),

  get: (schemeCode: string) => api.get(`/schemes/${schemeCode}`),

  create: (data: SchemeCreate, createdBy: string) =>
    api.post(`/schemes/?created_by=${createdBy}`, data),
};

// Fund Flows ⚡
export const fundFlowAPI = {
  track: (data: FundFlowRequest) => api.post("/funds/track", data),

  getFlowPath: (schemeId: string) => api.get(`/funds/scheme/${schemeId}/flow`),

  getTotalTransferred: (schemeId: string) =>
    api.get(`/funds/scheme/${schemeId}/total-transferred`),

  getStatusDistribution: (schemeId: string) =>
    api.get(`/funds/scheme/${schemeId}/status-distribution`),

  detectBottlenecks: (schemeId: string) =>
    api.get(`/funds/scheme/${schemeId}/bottlenecks`),
};

// Nodal Agencies
export const nodalAgencyAPI = {
  register: (data: NodalAgencyRequest) =>
    api.post("/nodal-agencies/register", data),

  getByScheme: (schemeId: string) =>
    api.get(`/nodal-agencies/scheme/${schemeId}`),

  detectIdleFunds: (params?: IdleFundParams) =>
    api.get("/nodal-agencies/idle-funds", { params }),

  flag: (agencyId: string, reason: string) =>
    api.post(`/nodal-agencies/${agencyId}/flag`, { reason }),
};

// Utilization
export const utilizationAPI = {
  submit: (data: UCRequest) => api.post("/utilization/submit", data),

  getByScheme: (schemeId: string) => api.get(`/utilization/scheme/${schemeId}`),

  getOverdue: (params?: OverdueParams) =>
    api.get("/utilization/overdue", { params }),
};
```

---

## 🛡️ Error Handling

### Error Types and Handling

```typescript
// utils/errorHandler.ts
export class APIError extends Error {
  constructor(
    public status: number,
    public message: string,
    public details?: any,
  ) {
    super(message);
  }
}

export function handleAPIError(error: any) {
  if (error.response) {
    // Backend returned error
    const status = error.response.status;
    const data = error.response.data;

    switch (status) {
      case 400:
        toast.error("Invalid request: " + data.detail);
        break;
      case 404:
        toast.error("Resource not found");
        break;
      case 422:
        // Validation error
        const validationErrors = data.detail
          .map((err: any) => `${err.loc.join(".")}: ${err.msg}`)
          .join("\n");
        toast.error("Validation Error:\n" + validationErrors);
        break;
      case 500:
        toast.error("Server error. Please try again.");
        break;
      default:
        toast.error("An error occurred: " + data.detail);
    }
  } else if (error.request) {
    // Network error
    toast.error("Network error. Please check your connection.");
  } else {
    // Other error
    toast.error("An unexpected error occurred.");
  }
}
```

### Auto-Integration Error Handling

```typescript
function handleAutoIntegrationError(response: FundFlowResponse) {
  if (!response.nodal_agency_updated && response.nodal_agency_error) {
    const errorDialog = {
      title: "⚠️ Auto-Integration Failed",
      message: response.nodal_agency_error,
      actions: [
        {
          label: "Create Manually",
          onClick: () => router.push("/nodal-agencies/create"),
        },
        {
          label: "Retry",
          onClick: () => retryAutoIntegration(response.id),
        },
        {
          label: "Dismiss",
          onClick: () => {},
        },
      ],
    };

    showDialog(errorDialog);
  }
}
```

---

## 🔄 Real-time Updates

### Firebase Realtime Listeners

```typescript
// hooks/useRealtimeFundFlows.ts
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";

export function useRealtimeFundFlows(schemeId: string) {
  const [fundFlows, setFundFlows] = useState<FundFlow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = db
      .collection("fund_flows")
      .where("scheme_id", "==", schemeId)
      .orderBy("created_at", "desc")
      .onSnapshot((snapshot) => {
        const flows = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as FundFlow[];

        setFundFlows(flows);
        setLoading(false);

        // Notify on new credited flows
        snapshot.docChanges().forEach((change) => {
          if (
            change.type === "added" &&
            change.doc.data().status === "credited"
          ) {
            const flow = change.doc.data();
            toast.success(
              `💰 New fund credited: ₹${flow.amount / 10000000} Crore`,
              { duration: 4000 },
            );
          }
        });
      });

    return unsubscribe;
  }, [schemeId]);

  return { fundFlows, loading };
}

// hooks/useRealtimeNodalAgencies.ts
export function useRealtimeNodalAgencies(schemeId: string) {
  const [agencies, setAgencies] = useState<NodalAgency[]>([]);

  useEffect(() => {
    const unsubscribe = db
      .collection("nodal_agencies")
      .where("scheme_id", "==", schemeId)
      .onSnapshot((snapshot) => {
        const agencies = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as NodalAgency[];

        setAgencies(agencies);

        // Notify on auto-created agencies
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            const agency = change.doc.data();
            if (agency.created_by === "system_auto_created") {
              toast.info(
                `⚡ New nodal agency auto-created: ${agency.agency_name}`,
                { duration: 5000, icon: "⚡" },
              );
            }
          }
        });
      });

    return unsubscribe;
  }, [schemeId]);

  return { agencies };
}
```

---

## 📊 Data Flow Diagrams

### Fund Flow with Auto-Integration

```
USER ACTION (Frontend)
  │
  ├─ Select Scheme
  │   └─ GET /schemes/{scheme_code}
  │
  ├─ Fill Fund Flow Form
  │   ├─ From: National (Ministry)
  │   ├─ To: State (Department)
  │   ├─ Amount: ₹500 Crore
  │   └─ Status: CREDITED ⚡
  │
  ├─ Submit Form
  │   └─ POST /funds/track
  │       │
  │       ├─ Backend Processing ⚡
  │       │   ├─ Create fund_flow in Firebase
  │       │   ├─ Check: status=="credited" && to_level=="State"
  │       │   │   └─ YES → AUTO-INTEGRATION
  │       │   │       ├─ Search for existing nodal agency
  │       │   │       ├─ If not found: Create new agency
  │       │   │       ├─ Update agency balance
  │       │   │       └─ Add response fields:
  │       │   │           • nodal_agency_updated: true
  │       │   │           • nodal_agency_id: "1"
  │       │   │           • nodal_agency_error: null
  │       │   │
  │       │   └─ Return FundFlowResponse
  │       │
  │       └─ Response to Frontend
  │           │
  │           ├─ Update UI: Fund Flow Created ✅
  │           │
  │           ├─ Check nodal_agency_updated
  │           │   └─ IF TRUE:
  │           │       ├─ Show success notification
  │           │       ├─ Display agency details
  │           │       └─ Refresh nodal agency list
  │           │   └─ IF FALSE:
  │           │       └─ Show warning with error
  │           │
  │           └─ Refresh Dashboard
  │
  └─ Real-time Updates
      ├─ FirebaseListener: fund_flows collection
      │   └─ Update fund flow visualization
      │
      └─ Firebase Listener: nodal_agencies collection
          └─ Show new agency notification ⚡
```

### Complete Workflow: Central → State → District

```
CENTRAL GOVERNMENT
  │
  ├─ POST /funds/track
  │   ├─ from_level: "National"
  │   ├─ to_level: "State"
  │   ├─ status: "credited"
  │   └─ ⚡ AUTO-INTEGRATION
  │       └─ Nodal Agency Created (State-level)
  │
  ▼
STATE GOVERNMENT
  │
  ├─ Receives ₹500 Cr (Nodal Agency Balance: ₹500 Cr)
  │
  ├─ POST /funds/track
  │   ├─ from_level: "State"
  │   ├─ to_level: "District"
  │   ├─ status: "transferred"
  │   └─ No auto-integration (not credited yet)
  │
  ▼
DISTRICT GOVERNMENT
  │
  ├─ Confirms Receipt
  │
  ├─ POST /funds/track (update status)
  │   ├─ status: "credited"
  │   └─ ⚡ Could trigger district-level nodal agency
  │
  ▼
DEPARTMENT
  │
  ├─ POST /utilization/submit
  │   └─ Utilization Certificate
  │
  └─ POST /beneficiaries/payment
      └─ Direct Benefit Transfer (DBT)
```

---

## 🎯 User Roles and Permissions

### Role-Based Access Control

```typescript
enum UserRole {
  CENTRAL_ADMIN = "central_admin",
  STATE_ADMIN = "state_admin",
  DISTRICT_ADMIN = "district_admin",
  VIEWER = "viewer",
}

interface Permission {
  module: string;
  actions: ("create" | "read" | "update" | "delete")[];
}

const rolePermissions: Record<UserRole, Permission[]> = {
  [UserRole.CENTRAL_ADMIN]: [
    { module: "schemes", actions: ["create", "read", "update", "delete"] },
    { module: "fund_flows", actions: ["create", "read", "update", "delete"] },
    {
      module: "nodal_agencies",
      actions: ["create", "read", "update", "delete"],
    },
    { module: "analytics", actions: ["read"] },
  ],

  [UserRole.STATE_ADMIN]: [
    { module: "schemes", actions: ["read"] },
    { module: "fund_flows", actions: ["create", "read", "update"] },
    { module: "nodal_agencies", actions: ["read", "update"] },
    { module: "utilization", actions: ["create", "read", "update"] },
  ],

  [UserRole.DISTRICT_ADMIN]: [
    { module: "schemes", actions: ["read"] },
    { module: "fund_flows", actions: ["read", "update"] },
    { module: "utilization", actions: ["create", "read"] },
  ],

  [UserRole.VIEWER]: [
    { module: "schemes", actions: ["read"] },
    { module: "fund_flows", actions: ["read"] },
    { module: "analytics", actions: ["read"] },
  ],
};
```

---

## 📱 Responsive Design Considerations

### Mobile Layout

```
┌─────────────────────────────┐
│  ☰  Loknidhi      🔔 👤    │
├─────────────────────────────┤
│                             │
│  Dashboard                  │
│  ┌───────────────────────┐ │
│  │ Total Budget          │ │
│  │ ₹5,000 Cr            │ │
│  └───────────────────────┘ │
│  ┌───────────────────────┐ │
│  │ Transferred           │ │
│  │ ₹3,500 Cr (70%)      │ │
│  └───────────────────────┘ │
│                             │
│  Recent Fund Flows          │
│  ┌───────────────────────┐ │
│  │ FF-2024-001 ⚡        │ │
│  │ ₹500 Cr              │ │
│  │ MH Health Dept        │ │
│  │ [View Details →]      │ │
│  └───────────────────────┘ │
│                             │
│  [+ New Transfer]           │
│                             │
└─────────────────────────────┘
```

**Key Points:**

- Stack components vertically
- Use bottom sheet for forms
- Swipe gestures for navigation
- Pull-to-refresh for updates
- Simplified charts for small screens

---

## 🔐 Security Considerations

### Frontend Security Best Practices

1. **API Authentication**

```typescript
// Add JWT token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

2. **Input Validation**

```typescript
const fundFlowSchema = z.object({
  scheme_id: z.string().min(1),
  amount: z.number().positive().max(1000000000000), // Max ₹10 Lakh Cr
  from_level: z.enum(["National", "State", "District", "Department"]),
  to_level: z.enum(["National", "State", "District", "Department"]),
  status: z.enum(["sanctioned", "transferred", "credited", "failed"]),
});
```

3. **Sensitive Data Protection**

```typescript
// Never log sensitive data
console.log("Fund flow created:", {
  id: response.id,
  amount: "***REDACTED***", // Don't log amounts in production
  status: response.status,
});
```

---

## 🚀 Performance Optimization

### Optimizations

1. **Lazy Loading**

```typescript
const FundFlowVisualization = lazy(() => import("./FundFlowVisualization"));
const Analytics = lazy(() => import("./Analytics"));
```

2. **Data Caching**

```typescript
// Use React Query for caching
const { data: schemes } = useQuery(
  ["schemes", filters],
  () => schemeAPI.list(filters),
  {
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  },
);
```

3. **Virtualized Lists**

```typescript
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={fundFlows.length}
  itemSize={80}
>
  {({ index, style }) => (
    <FundFlowItem
      fundFlow={fundFlows[index]}
      style={style}
    />
  )}
</FixedSizeList>
```

---

## 📦 Recommended Tech Stack

### Frontend Framework

- **React 18+** with TypeScript
- **Next.js 14+** (for SSR and routing)
- **Tailwind CSS** (styling)

### State Management

- **Zustand** or **Redux Toolkit**
- **React Query** (server state)

### UI Components

- **shadcn/ui** or **MUI**
- **Recharts** (charts)
- **React Flow** (flow diagrams)

### Forms & Validation

- **React Hook Form**
- **Zod** (schema validation)

### Firebase

- **Firebase SDK 10+**
- Real-time listeners for live updates

### Testing

- **Vitest** (unit tests)
- **Playwright** (E2E tests)

---

## 🎓 Implementation Checklist

### Phase 1: Core Features ✅

- [ ] Setup project with Next.js + TypeScript
- [ ] Configure API client with Axios
- [ ] Implement authentication
- [ ] Create layout components (Navbar, Sidebar)
- [ ] Implement Scheme Management UI
- [ ] Implement Fund Flow Tracking UI ⚡
- [ ] Add auto-integration indicator
- [ ] Handle auto-integration responses
- [ ] Implement Nodal Agency Monitoring UI
- [ ] Add Firebase realtime listeners

### Phase 2: Advanced Features

- [ ] Implement Utilization Certificate UI
- [ ] Add Analytics Dashboard
- [ ] Implement Anomaly Detection UI
- [ ] Add Predictive Analytics
- [ ] Implement Budget Reallocation UI
- [ ] Add Beneficiary Payment Tracking
- [ ] Implement Convergence Detection UI
- [ ] Add Outcome Monitoring

### Phase 3: Enhancements

- [ ] Add real-time notifications
- [ ] Implement advanced filtering
- [ ] Add export to Excel/PDF
- [ ] Implement offline mode
- [ ] Add mobile responsive design
- [ ] Optimize performance
- [ ] Add comprehensive error handling
- [ ] Implement role-based access control

---

## 📞 Support & Resources

### API Documentation

- Swagger UI: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`

### Firebase Console

- Project: lokniti-66d58
- Console: https://console.firebase.google.com

### Backend Repository

- Location: `d:\abhay_projects\coherence-26\backend`
- Server: `http://127.0.0.1:8000`

---

## 🎉 Summary

This frontend workflow guide provides a complete blueprint for integrating with the Loknidhi backend system. The key features include:

✅ **11 Modules** with comprehensive API integration  
⚡ **Automatic Nodal Agency Integration** - The killer feature!  
📊 **Real-time Updates** with Firebase listeners  
🎨 **Component Architecture** with best practices  
🔐 **Security** and error handling  
📱 **Responsive Design** for all devices

The automatic nodal agency integration is fully operational and tested. When a fund is credited to the state level, the system automatically creates/updates the nodal agency and returns confirmation in the API response.

**Happy Coding! 🚀**
