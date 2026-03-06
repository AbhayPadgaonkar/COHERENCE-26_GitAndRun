"""Application Constants"""

# Financial Thresholds
ANOMALY_DETECTION_THRESHOLD = 0.7  # Anomaly score threshold
FUND_LAPSE_WARNING_DAYS = 30  # Days before fund lapse warning

# Budget Utilization Levels
CRITICAL_UTILIZATION = 0.25  # Below 25% is critical
WARNING_UTILIZATION = 0.50   # Below 50% is warning
GOOD_UTILIZATION = 0.75      # Above 75% is good

# Administrative Levels
ADMIN_LEVELS = ["National", "State", "District", "Department"]

# Fund Flow Status
FUND_STATUS_ALLOCATED = "allocated"
FUND_STATUS_TRANSFERRED = "transferred"
FUND_STATUS_UTILIZED = "utilized"
FUND_STATUS_LAPSED = "lapsed"

# Anomaly Types
ANOMALY_TYPE_SUDDEN_SPIKE = "sudden_spike"
ANOMALY_TYPE_IRREGULAR_PATTERN = "irregular_pattern"
ANOMALY_TYPE_FUND_IDLE = "fund_idle"
ANOMALY_TYPE_DUPLICATE_PAYMENT = "duplicate_payment"
ANOMALY_TYPE_FUND_LAPSE = "fund_lapse"

# ============ INDIAN GOVERNMENT SCHEME CONSTANTS ============

# Scheme Types (Based on Ministry Categorization)
SCHEME_TYPES = [
    "Health",
    "Education",
    "Rural Development",
    "Agriculture",
    "Social Security",
    "Employment",
    "Infrastructure",
    "Water & Sanitation",
    "Energy",
    "Urban Development",
    "Financial Inclusion",
    "Skills Training",
    "Environment",
    "Tourism",
    "Sports",
    "Culture"
]

# Beneficiary Categories (Government of India classifications)
BENEFICIARY_CATEGORIES = [
    "BPL",           # Below Poverty Line
    "APL",           # Above Poverty Line
    "SC",            # Scheduled Caste
    "ST",            # Scheduled Tribe
    "OBC",           # Other Backward Classes
    "General",       # General Category
    "Women",         # Women-focused
    "Youth",         # Youth (18-35 years)
    "Farmers",       # Agricultural workers
    "PWD",           # Persons with Disabilities
    "Minorities",    # Religious minorities
    "Backward Classes",
    "Economically Weaker Sections"
]

# Major Central Schemes (Pradhan Mantri Yojanas)
MAJOR_SCHEMES = {
    "PMJAY": "Pradhan Mantri Jan Arogya Yojana (Health)",
    "PMAY": "Pradhan Mantri Awas Yojana (Housing)",
    "PM-KISAN": "Pradhan Mantri Kisan Samman Nidhi (Agriculture)",
    "MUDRA": "Pradhan Mantri MUDRA Yojana (Micro Finance)",
    "PMJDY": "Pradhan Mantri Jan Dhan Yojana (Financial Inclusion)",
    "MGNREGA": "Mahatma Gandhi National Rural Employment Guarantee Act",
    "NSP": "National Social Assistance Programme",
    "NHM": "National Health Mission",
    "PMSBY": "Pradhan Mantri Suraksha Bima Yojana",
    "APY": "Atal Pension Yojana",
    "NRLM": "National Rural Livelihoods Mission",
    "ICDS": "Integrated Child Development Services",
    "MDM": "Mid Day Meal Scheme"
}

# Major Implementing Ministries
MINISTRIES = [
    "Ministry of Health and Family Welfare",
    "Ministry of Education",
    "Ministry of Rural Development",
    "Ministry of Agriculture & Farmers Welfare",
    "Ministry of Social Justice and Empowerment",
    "Ministry of Labour and Employment",
    "Ministry of Housing and Urban Affairs",
    "Ministry of Jal Shakti",
    "Ministry of Power",
    "Ministry of Finance",
    "Ministry of Women and Child Development",
    "Ministry of Panchayati Raj",
    "Ministry of Tribal Affairs",
    "Ministry of Minority Affairs"
]

# Indian States
INDIAN_STATES = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar",
    "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh",
    "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra",
    "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
    "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
    "Uttar Pradesh", "Uttarakhand", "West Bengal",
    "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli",
    "Daman and Diu", "Delhi", "Lakshadweep", "Puducherry"
]

# Scheme Status
SCHEME_STATUS_ACTIVE = "Active"
SCHEME_STATUS_INACTIVE = "Inactive"
SCHEME_STATUS_PAUSED = "Paused"
SCHEME_STATUS_CLOSED = "Closed"
SCHEME_STATUS_PROPOSED = "Proposed"

SCHEME_STATUSES = [SCHEME_STATUS_ACTIVE, SCHEME_STATUS_INACTIVE, 
                   SCHEME_STATUS_PAUSED, SCHEME_STATUS_CLOSED, SCHEME_STATUS_PROPOSED]

# Fiscal Year Format
CURRENT_FISCAL_YEAR = "2024-2025"
FISCAL_YEAR_START = "April"
FISCAL_YEAR_END = "March"

# ============ PFMS Integration Constants ============
PFMS_STATUS_CODES = [
    "MANDATE_CREATED",
    "PAYMENT_INITIATED",
    "PAYMENT_IN_PROGRESS",
    "PAYMENT_SUCCESS",
    "PAYMENT_FAILED",
    "PAYMENT_REVERSED",
    "MANDATE_CANCELLED"
]

# ============ DBT Payment Status ============
DBT_PAYMENT_STATUS = [
    "INITIATED",
    "AADHAAR_VERIFICATION_PENDING",
    "AADHAAR_VERIFIED",
    "NPCI_PROCESSING",
    "BANK_PROCESSING",
    "BANK_CREDITED",
    "SUCCESS",
    "FAILED",
    "REVERSED",
    "PENDING_VERIFICATION"
]

# ============ Payment Modes ============
PAYMENT_MODES = [
    "RTGS",         # Real Time Gross Settlement
    "NEFT",         # National Electronic Funds Transfer
    "IMPS",         # Immediate Payment Service
    "ECS",          # Electronic Clearing Service
    "UPI",          # Unified Payments Interface
    "CHEQUE",       # Physical cheque
    "DEMAND_DRAFT", # DD
    "E_WARRANTY"    # Electronic warranty
]

# ============ UC Status ============
UC_STATUS = [
    "NOT_SUBMITTED",
    "SUBMITTED",
    "UNDER_VERIFICATION",
    "VERIFIED",
    "REJECTED",
    "OVERDUE",
    "CONDITIONALLY_ACCEPTED"
]

# ============ Release Types ============
RELEASE_TYPES = [
    "FIRST_INSTALLMENT",
    "SECOND_INSTALLMENT",
    "THIRD_INSTALLMENT",
    "FINAL_INSTALLMENT",
    "EMERGENCY_RELEASE",
    "SUPPLEMENTARY_GRANT",
    "SPECIAL_ALLOCATION"
]

# ============ Nodal Agency Types ============
NODAL_AGENCY_TYPES = [
    "Central Nodal Agency",
    "State Nodal Agency",
    "District Nodal Agency",
    "Sectoral Nodal Agency"
]

# ============ State Codes (ISO 3166-2:IN) ============
INDIAN_STATE_CODES = {
    "IN-AP": "Andhra Pradesh",
    "IN-AR": "Arunachal Pradesh",
    "IN-AS": "Assam",
    "IN-BR": "Bihar",
    "IN-CT": "Chhattisgarh",
    "IN-GA": "Goa",
    "IN-GJ": "Gujarat",
    "IN-HR": "Haryana",
    "IN-HP": "Himachal Pradesh",
    "IN-JH": "Jharkhand",
    "IN-KA": "Karnataka",
    "IN-KL": "Kerala",
    "IN-MP": "Madhya Pradesh",
    "IN-MH": "Maharashtra",
    "IN-MN": "Manipur",
    "IN-ML": "Meghalaya",
    "IN-MZ": "Mizoram",
    "IN-NL": "Nagaland",
    "IN-OR": "Odisha",
    "IN-PB": "Punjab",
    "IN-RJ": "Rajasthan",
    "IN-SK": "Sikkim",
    "IN-TN": "Tamil Nadu",
    "IN-TG": "Telangana",
    "IN-TR": "Tripura",
    "IN-UP": "Uttar Pradesh",
    "IN-UT": "Uttarakhand",
    "IN-WB": "West Bengal",
    "IN-AN": "Andaman and Nicobar Islands",
    "IN-CH": "Chandigarh",
    "IN-DN": "Dadra and Nagar Haveli and Daman and Diu",
    "IN-DL": "Delhi",
    "IN-JK": "Jammu and Kashmir",
    "IN-LA": "Ladakh",
    "IN-LD": "Lakshadweep",
    "IN-PY": "Puducherry"
}

# ============ CSS/CS Scheme Types ============
SCHEME_CLASSIFICATION = [
    "Central Sector Scheme",        # 100% funded by Centre
    "Centrally Sponsored Scheme",   # Shared funding Centre:State
    "State Scheme",                 # 100% funded by State
    "District Scheme"               # District-level scheme
]

# ============ Sharing Patterns (Centre:State) ============
SHARING_PATTERNS = [
    "100:0",    # Central Sector Scheme
    "90:10",    # North-Eastern states pattern
    "80:20",    # Special category states
    "75:25",    # Some CSS
    "60:40",    # Most CSS
    "50:50",    # Equal sharing
    "0:100"     # State scheme
]

# ============ eKYC Status ============
EKYC_STATUS = [
    "NOT_DONE",
    "SUCCESS",
    "FAILED",
    "PENDING"
]

# ============ Fraud Risk Levels ============
def get_fraud_risk_level(score: float) -> str:
    """Get fraud risk level based on score"""
    if score <= 0.3:
        return "LOW"
    elif score <= 0.6:
        return "MEDIUM"
    elif score <= 0.8:
        return "HIGH"
    else:
        return "CRITICAL"

# ============ Convergence Overlap Types ============
CONVERGENCE_OVERLAP_TYPES = [
    "Geographic",
    "Beneficiary",
    "Infrastructure",
    "Sectoral",
    "Temporal"
]

# ============ Convergence Resolution Status ============
CONVERGENCE_RESOLUTION_STATUS = [
    "Unresolved",
    "Under Review",
    "Resolved",
    "Accepted Overlap",
    "Reallocation Pending"
]
