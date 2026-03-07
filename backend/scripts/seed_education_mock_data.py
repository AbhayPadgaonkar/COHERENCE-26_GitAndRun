#!/usr/bin/env python3
"""
Seed mock data to -beta Firestore collections for all departments.
Uses frontend options.json codes: state MH, districts MH-MUM, MH-PUN, MH-THA, MH-NSK, MH-PGR;
departments DEPT-EDU, DEPT-HLT, DEPT-PWD, DEPT-RUR, DEPT-TRN.
Collections: schemes-beta, fund_flows-beta, beneficiary_payments-beta, anomalies-beta, nodal_agencies-beta.
Does NOT modify users collection.
"""

import os
import sys
from datetime import datetime, timedelta

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.core.firebase import FirebaseConfig

# Collection names (same as frontend will use)
SCHEMES_COLL = "schemes-beta"
FUND_FLOWS_COLL = "fund_flows-beta"
BENEFICIARY_PAYMENTS_COLL = "beneficiary_payments-beta"
ANOMALIES_COLL = "anomalies-beta"
NODAL_AGENCIES_COLL = "nodal_agencies-beta"

# Geography from frontend options.json (Maharashtra)
STATE_CODE = "MH"
STATE_NAME = "Maharashtra"
STATE_CODE_FULL = "IN-MH"
DISTRICTS = [
    {"name": "Mumbai", "code": "MH-MUM"},
    {"name": "Pune", "code": "MH-PUN"},
    {"name": "Thane", "code": "MH-THA"},
    {"name": "Nashik", "code": "MH-NSK"},
    {"name": "Palghar", "code": "MH-PGR"},
]

# Department IDs from frontend options.json
DEPT_EDU = "DEPT-EDU"
DEPT_HLT = "DEPT-HLT"
DEPT_PWD = "DEPT-PWD"
DEPT_RUR = "DEPT-RUR"
DEPT_TRN = "DEPT-TRN"

# Legacy IDs per department (for scheme_id in beneficiary_payments and anomalies; map in schemes via legacy_id)
LEGACY_IDS = {DEPT_EDU: 9001, DEPT_HLT: 9002, DEPT_PWD: 9003, DEPT_RUR: 9004, DEPT_TRN: 9005}

# Department config: scheme_code_prefix, scheme_name, ministry, vendor_name_templates per district
DEPARTMENT_SCHEMES = [
    {
        "dept_id": DEPT_EDU,
        "schemes": [
            {"code": "SAMAGRA-EDU-001", "name": "Samagra Shiksha - School Education", "ministry": "Ministry of Education"},
            {"code": "PMPOSHAN-EDU-002", "name": "PM POSHAN (Mid-Day Meal)", "ministry": "Ministry of Education"},
        ],
        "vendor_templates": {
            "Mumbai": ["Edu Supplies Mumbai Pvt Ltd", "School Infra Contractors Ltd", "MDM Food Suppliers", "Digital Learning Solutions", "Uniform & Stationery Co"],
            "Pune": ["Pune Edu Works Pvt Ltd", "Mid Day Meal Caterers Pune", "Smart Class Equipment Co", "School Furniture Suppliers", "Library Books Vendor"],
            "Thane": ["Thane Civil Works Contractors", "PM POSHAN Thane Caterers", "Lab Equipment Thane", "Sports Material Supplier"],
            "Nashik": ["Nashik Edu Infrastructure", "Poshan Nashik Food Services", "Science Kit Suppliers", "Toilet Block Contractors", "Teacher Training Agency"],
            "Palghar": ["Palghar School Infra Ltd", "Rural MDM Suppliers", "Desk Bench Manufacturers", "RO Water System Vendor", "Computer Lab Setup Co"],
        },
    },
    {
        "dept_id": DEPT_HLT,
        "schemes": [
            {"code": "NHM-HLT-001", "name": "National Health Mission", "ministry": "Ministry of Health and Family Welfare"},
            {"code": "PMJAY-HLT-002", "name": "Ayushman Bharat PM-JAY", "ministry": "Ministry of Health and Family Welfare"},
        ],
        "vendor_templates": {
            "Mumbai": ["MedEquip Mumbai Ltd", "Hospital Supply Co", "Pharma Distributors", "Lab Reagents Supplier", "Ambulance Services"],
            "Pune": ["Pune Medical Equipment", "Health Infrastructure Pvt Ltd", "Drug Procurement Agency", "Diagnostic Kit Vendor", "Surgical Supplies"],
            "Thane": ["Thane Health Works", "Rural Health Equipment", "Vaccine Cold Chain Co", "OT Equipment Supplier"],
            "Nashik": ["Nashik Medical Supplies", "PHC Infrastructure Ltd", "Medicine Procurement Co", "X-Ray Equipment Vendor", "Ambulance Fleet"],
            "Palghar": ["Palghar Health Contractors", "Tribal Health Supplies", "Mobile Health Unit Co", "Sterilization Equipment", "Telemedicine Vendor"],
        },
    },
    {
        "dept_id": DEPT_PWD,
        "schemes": [
            {"code": "PMGSY-PWD-001", "name": "PM Gram Sadak Yojana", "ministry": "Ministry of Rural Development"},
            {"code": "BHARATMALA-PWD-002", "name": "Bharat Mala - Road Infrastructure", "ministry": "Ministry of Road Transport"},
        ],
        "vendor_templates": {
            "Mumbai": ["Road Construction Co Mumbai", "Bridge Works Ltd", "Asphalt Suppliers", "Traffic Signal Co", "Street Light Contractors"],
            "Pune": ["Pune Highways Pvt Ltd", "Paving Contractors", "Drainage Works Co", "Footpath Construction", "Barrier Suppliers"],
            "Thane": ["Thane PWD Contractors", "RCC Pipe Suppliers", "Culvert Construction", "Road Marking Co"],
            "Nashik": ["Nashik Road Builders", "Aggregate Suppliers", "Road Safety Equipment", "JCB & Machinery Hire", "Guard Rail Co"],
            "Palghar": ["Palghar Rural Roads Ltd", "Gravel Suppliers", "Small Bridge Contractors", "Village Road Co", "Cement Suppliers"],
        },
    },
    {
        "dept_id": DEPT_RUR,
        "schemes": [
            {"code": "MGNREGA-RUR-001", "name": "MGNREGA - Rural Employment", "ministry": "Ministry of Rural Development"},
            {"code": "NRLM-RUR-002", "name": "National Rural Livelihoods Mission", "ministry": "Ministry of Rural Development"},
        ],
        "vendor_templates": {
            "Mumbai": ["Rural Works Mumbai", "SHG Federation Supplies", "Tool & Tractor Hire", "Seed & Fertilizer Co", "Water Tank Contractors"],
            "Pune": ["Pune MGNREGA Contractors", "Watershed Development Co", "Farm Equipment Vendor", "Pond Digging Co", "Fencing Suppliers"],
            "Thane": ["Thane Rural Infra", "Livelihood Training Agency", "Cattle Feed Supplier", "Irrigation Pipe Co"],
            "Nashik": ["Nashik Rural Development", "Check Dam Contractors", "Plantation Co", "Rural Housing Materials", "Solar Pump Vendor"],
            "Palghar": ["Palghar Tribal Livelihoods", "Forest Produce Co", "Hand Pump Installation", "Village Hall Contractors", "Anganwadi Construction"],
        },
    },
    {
        "dept_id": DEPT_TRN,
        "schemes": [
            {"code": "FAME-TRN-001", "name": "FAME India - Electric Mobility", "ministry": "Ministry of Heavy Industries"},
            {"code": "MSRTC-TRN-002", "name": "State Transport Infrastructure", "ministry": "Ministry of Transport"},
        ],
        "vendor_templates": {
            "Mumbai": ["EV Charging Mumbai Ltd", "Bus Body Builders", "Fleet Maintenance Co", "Ticketing System Vendor", "Depot Infrastructure"],
            "Pune": ["Pune EV Solutions", "CNG Conversion Co", "Bus Shelter Contractors", "CCTV Transport Co", "Parking Lot Developers"],
            "Thane": ["Thane Transport Works", "Metro Feeder Bus Co", "Charging Station Co", "Signage Contractors"],
            "Nashik": ["Nashik Transport Infra", "Intercity Bus Body Co", "Depot Construction", "Fuel Station Vendor", "Workshop Equipment"],
            "Palghar": ["Palghar Rural Transport", "Village Bus Stop Co", "E-Rickshaw Suppliers", "Roadside Amenities", "Weighbridge Co"],
        },
    },
]


def _ts(dt: datetime) -> str:
    return dt.isoformat()


def seed_schemes(db):
    """Create schemes for all departments. Returns dict: scheme_doc_id -> { dept_id, legacy_id }."""
    now = datetime.utcnow()
    launch = (now - timedelta(days=400)).replace(hour=0, minute=0, second=0, microsecond=0)
    ref = db.collection(SCHEMES_COLL)
    scheme_map = {}  # doc_id -> legacy_id / dept_id for later use
    coverage_district_codes = [d["code"] for d in DISTRICTS]

    for dept in DEPARTMENT_SCHEMES:
        legacy_id = LEGACY_IDS[dept["dept_id"]]
        for s in dept["schemes"]:
            doc_data = {
                "scheme_code": s["code"],
                "name": s["name"],
                "description": f"{s['name']} - contracts and vendor payments.",
                "ministry": s["ministry"],
                "state_nodal_agency": f"{STATE_NAME} State {dept['dept_id']} Nodal Agency",
                "budget_allocated": 1200000000.0 + (legacy_id * 100000000),
                "fiscal_year": 2024,
                "budget_financial_year": "2024-2025",
                "scheme_type": dept["dept_id"].replace("DEPT-", ""),
                "target_beneficiaries": 5000000,
                "beneficiary_category": "General",
                "launch_date": _ts(launch),
                "status": "Active",
                "priority": "high",
                "coverage_states": [STATE_NAME],
                "coverage_type": "National",
                "pfms_scheme_code": f"PFMS-{s['code']}",
                "css_type": "Centrally Sponsored Scheme",
                "sharing_pattern": "60:40",
                "coverage_state_codes": [STATE_CODE_FULL],
                "coverage_district_codes": coverage_district_codes,
                "legacy_id": legacy_id,
                "department_id": dept["dept_id"],
                "created_at": _ts(now),
                "updated_at": _ts(now),
                "created_by": "seed_mock_beta",
            }
            _, doc_ref = ref.add(doc_data)
            scheme_map[doc_ref.id] = {"legacy_id": legacy_id, "dept_id": dept["dept_id"], "code": s["code"]}

    print(f"  Created {len(scheme_map)} schemes in {SCHEMES_COLL}")
    return scheme_map


def seed_fund_flows(db, scheme_map):
    """Central → State → Districts. Use doc ids from scheme_map. Add idle-style transfers for Thane/Nashik."""
    now = datetime.utcnow()
    base = now - timedelta(days=120)
    ref = db.collection(FUND_FLOWS_COLL)
    count = 0

    # Build list of (doc_id, code) per department (first scheme per dept for flows)
    seen_dept = set()
    scheme_list = []
    for doc_id, info in scheme_map.items():
        if info["dept_id"] not in seen_dept:
            seen_dept.add(info["dept_id"])
            scheme_list.append((doc_id, info["code"].split("-")[0]))

    for scheme_doc_id, name in scheme_list:
        sanction = base
        transfer = sanction + timedelta(days=3)
        credited = transfer + timedelta(days=1)
        ref.add({
            "scheme_id": scheme_doc_id,
            "fund_flow_reference": f"FF-{name}-CENT-{STATE_CODE}-001",
            "from_level": "National",
            "to_level": "State",
            "from_entity_code": "MIN-CENT",
            "to_entity_code": STATE_CODE_FULL,
            "from_entity_name": "Central Ministry",
            "to_entity_name": f"{STATE_NAME} State DDO",
            "amount": 350000000.0,
            "currency": "INR",
            "payment_mode": "RTGS",
            "sanction_date": _ts(sanction),
            "transfer_date": _ts(transfer),
            "credited_date": _ts(credited),
            "status": "credited",
            "installment_number": 1,
            "total_installments": 4,
            "release_type": "FIRST_INSTALLMENT",
            "created_at": _ts(now),
        })
        count += 1

    # State → Districts (all 5). Thane and Nashik get an extra old "transferred" flow for idle_funds
    for scheme_doc_id, name in scheme_list:
        for idx, dist in enumerate(DISTRICTS):
            days_ago = 0
            if dist["code"] in ("MH-THA", "MH-NSK") and name in ("SAMAGRA", "NHM", "PMGSY"):
                days_ago = 50 if dist["code"] == "MH-THA" else 75
            t = (now - timedelta(days=days_ago)) if days_ago else (base + timedelta(days=30 + idx))
            transfer_d = t + timedelta(days=2)
            status = "transferred" if days_ago > 30 else "credited"
            cred = _ts(transfer_d + timedelta(days=1)) if status == "credited" else None
            ref.add({
                "scheme_id": scheme_doc_id,
                "fund_flow_reference": f"FF-{name}-{STATE_CODE}-{dist['code']}-{idx+1:04d}",
                "from_level": "State",
                "to_level": "District",
                "from_entity_code": STATE_CODE_FULL,
                "to_entity_code": dist["code"],
                "from_entity_name": f"{STATE_NAME} State DDO",
                "to_entity_name": f"{dist['name']} District DDO",
                "amount": 40000000.0 + idx * 5000000,
                "currency": "INR",
                "payment_mode": "NEFT",
                "sanction_date": _ts(t),
                "transfer_date": _ts(transfer_d),
                "credited_date": cred,
                "status": status,
                "installment_number": 1,
                "total_installments": 2,
                "release_type": "FIRST_INSTALLMENT",
                "created_at": _ts(now),
            })
            count += 1

    # Extra idle flows for Thane and Nashik (one per scheme type)
    for scheme_doc_id, name in scheme_list[:2]:
        for dist_code, days in [("MH-THA", 68), ("MH-NSK", 95)]:
            dist_name = next(d["name"] for d in DISTRICTS if d["code"] == dist_code)
            old = now - timedelta(days=days)
            transfer_d = old + timedelta(days=2)
            ref.add({
                "scheme_id": scheme_doc_id,
                "fund_flow_reference": f"FF-{name}-{STATE_CODE}-{dist_code}-idle",
                "from_level": "State",
                "to_level": "District",
                "from_entity_code": STATE_CODE_FULL,
                "to_entity_code": dist_code,
                "from_entity_name": f"{STATE_NAME} State DDO",
                "to_entity_name": f"{dist_name} District DDO",
                "amount": 25000000.0,
                "currency": "INR",
                "payment_mode": "NEFT",
                "sanction_date": _ts(old),
                "transfer_date": _ts(transfer_d),
                "credited_date": None,
                "status": "transferred",
                "installment_number": 2,
                "total_installments": 2,
                "release_type": "SECOND_INSTALLMENT",
                "created_at": _ts(now),
            })
            count += 1

    print(f"  Created {count} fund_flows in {FUND_FLOWS_COLL}")
    return count


def seed_beneficiary_payments(db, scheme_map):
    """4-5 vendor payments per district per department; scheme_id = legacy_id."""
    now = datetime.utcnow()
    ref = db.collection(BENEFICIARY_PAYMENTS_COLL)
    txn_id = 10000
    count = 0

    for dept in DEPARTMENT_SCHEMES:
        legacy_id = LEGACY_IDS[dept["dept_id"]]
        prefix = dept["dept_id"].replace("DEPT-", "")[:3]
        for dist in DISTRICTS:
            templates = dept["vendor_templates"].get(dist["name"], [])
            for v_idx, vname in enumerate(templates):
                txn_id += 1
                pay_date = now - timedelta(days=60 - v_idx * 7)
                ref.add({
                    "scheme_id": legacy_id,
                    "beneficiary_id": f"V-{prefix}-{dist['code']}-{v_idx+1:03d}",
                    "beneficiary_name": vname,
                    "aadhaar_masked": "XXXX-XXXX-" + str(1000 + txn_id)[-4:],
                    "mobile_number": "98" + str(10000000 + txn_id)[-8:],
                    "bank_account_number": "6" + str(txn_id).zfill(11),
                    "ifsc_code": "SBIN0001234",
                    "bank_name": "State Bank of India",
                    "payment_amount": 500000.0 + (txn_id % 7) * 150000.0,
                    "payment_purpose": "Grant",
                    "payment_date": _ts(pay_date),
                    "transaction_id": f"TXN-{prefix}-{txn_id}",
                    "pfms_transaction_id": f"PFMS-{prefix}-{txn_id}",
                    "utr_number": f"UTR{txn_id}",
                    "payment_status": "BANK_CREDITED",
                    "state": STATE_NAME,
                    "state_code": STATE_CODE_FULL,
                    "district": dist["name"],
                    "district_code": dist["code"],
                    "department_id": dept["dept_id"],
                    "created_by": "seed_mock_beta",
                    "created_at": _ts(now),
                })
                count += 1

    print(f"  Created {count} beneficiary_payments in {BENEFICIARY_PAYMENTS_COLL}")
    return count


def seed_anomalies(db):
    """Anomalies: idle_funds and fund_lapse for Thane, Nashik, State; per department legacy_id."""
    now = datetime.utcnow()
    ref = db.collection(ANOMALIES_COLL)

    items = []
    for dept_id, legacy_id in LEGACY_IDS.items():
        items.append({
            "scheme_id": legacy_id,
            "department_id": dept_id,
            "anomaly_type": "idle_funds",
            "severity": "warning",
            "confidence_score": 0.78,
            "description": f"[Idle Funds] Transfer to Thane District DDO idle 68+ days; department {dept_id}.",
            "detected_date": _ts(now),
            "created_at": _ts(now),
        })
        items.append({
            "scheme_id": legacy_id,
            "department_id": dept_id,
            "anomaly_type": "idle_funds",
            "severity": "critical",
            "confidence_score": 0.92,
            "description": f"[Idle Funds] Transfer to Nashik District DDO idle 95+ days; department {dept_id}.",
            "detected_date": _ts(now),
            "created_at": _ts(now),
        })
        items.append({
            "scheme_id": legacy_id,
            "department_id": dept_id,
            "anomaly_type": "fund_lapse",
            "severity": "critical",
            "confidence_score": 0.85,
            "description": f"[Fund Lapse] {STATE_NAME} State treasury unspent balance likely to lapse; department {dept_id}.",
            "detected_date": _ts(now),
            "created_at": _ts(now),
        })

    for a in items:
        ref.add(a)
    print(f"  Created {len(items)} anomalies in {ANOMALIES_COLL}")
    return len(items)


def seed_nodal_agencies(db, scheme_map):
    """One state nodal agency per department (first scheme doc_id)."""
    now = datetime.utcnow()
    ref = db.collection(NODAL_AGENCIES_COLL)
    seen_dept = set()
    count = 0
    for doc_id, info in scheme_map.items():
        if info["dept_id"] in seen_dept:
            continue
        seen_dept.add(info["dept_id"])
        last_txn = now - timedelta(days=45)
        ref.add({
            "agency_name": f"{STATE_NAME} State {info['dept_id']} - Nodal Agency",
            "agency_type": "State Nodal Agency",
            "account_number": f"NA-{STATE_CODE}-{info['dept_id']}",
            "bank_name": "State Bank of India",
            "branch_name": "Mumbai Main",
            "ifsc_code": "SBIN0000123",
            "scheme_id": doc_id,
            "scheme_code": info["code"],
            "state": STATE_NAME,
            "state_code": STATE_CODE_FULL,
            "opening_balance": 300000000.0,
            "current_balance": 85000000.0,
            "last_credit_amount": 40000000.0,
            "last_transaction_date": _ts(last_txn),
            "last_transaction_type": "CREDIT",
            "idle_days": 45,
            "is_idle": True,
            "idle_threshold_days": 30,
            "balance_threshold": 50000000.0,
            "account_status": "Flagged",
            "flagged_reason": "Idle funds above threshold",
            "flagged_date": _ts(now),
            "department_id": info["dept_id"],
            "created_at": _ts(now),
            "updated_at": _ts(now),
            "created_by": "seed_mock_beta",
        })
        count += 1
    print(f"  Created {count} nodal_agencies in {NODAL_AGENCIES_COLL}")
    return count


def main():
    db = FirebaseConfig.get_db()
    if not db:
        print("ERROR: Firebase not connected. Set FIREBASE_CREDENTIALS_PATH or use serviceAccountKey.json in backend.")
        sys.exit(1)

    print("\n" + "=" * 60)
    print("SEEDING -BETA COLLECTIONS (multi-department)")
    print("=" * 60)
    print(f"Collections: {SCHEMES_COLL}, {FUND_FLOWS_COLL}, {BENEFICIARY_PAYMENTS_COLL}, {ANOMALIES_COLL}, {NODAL_AGENCIES_COLL}")
    print(f"Geography: {STATE_NAME} ({STATE_CODE}), districts: {[d['code'] for d in DISTRICTS]}")
    print(f"Departments: DEPT-EDU, DEPT-HLT, DEPT-PWD, DEPT-RUR, DEPT-TRN")
    print("(Users collection is NOT modified.)\n")

    scheme_map = seed_schemes(db)
    seed_fund_flows(db, scheme_map)
    seed_beneficiary_payments(db, scheme_map)
    seed_anomalies(db)
    seed_nodal_agencies(db, scheme_map)

    print("\n" + "=" * 60)
    print("DONE. Use same -beta collection names in frontend to map data.")
    print("=" * 60 + "\n")


if __name__ == "__main__":
    main()
