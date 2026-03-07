"""Pydantic schemas for request/response validation"""
from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime


# ============ Scheme Management Schemas ============
class SchemeBase(BaseModel):
    """Indian Government Scheme Model with PFMS Integration"""
    scheme_code: str                  # Official scheme code (e.g., PMJAY-001)
    name: str                         # Scheme name in English
    name_hindi: Optional[str] = None  # Scheme name in Hindi
    description: Optional[str] = None
    
    # Ministry & Implementation
    ministry: str                     # Implementing ministry
    state_nodal_agency: Optional[str] = None  # State-level coordinating agency
    
    # Financial Details
    budget_allocated: float           # Total budget in INR
    fiscal_year: int                  # Fiscal year (2024-25)
    budget_financial_year: str        # FY format (2024-2025)
    
    # Scheme Details
    scheme_type: str                  # e.g., "Health", "Water", "Employment", "Education"
    target_beneficiaries: int         # Expected number of beneficiaries
    beneficiary_category: str         # e.g., "BPL", "APL", "SC/ST", "General"
    
    # Implementation Status
    launch_date: datetime
    status: str                       # Active, Inactive, Paused, Closed
    priority: str                     # high, medium, low
    
    # Geographic Scope
    coverage_states: List[str]        # List of states implementing scheme
    coverage_type: str                # National, State-specific, Regional
    
    # PFMS Integration (NEW)
    pfms_scheme_code: Optional[str] = None       # PFMS unique scheme identifier
    pfms_sanction_order: Optional[str] = None    # Sanction order number
    pfms_sanction_date: Optional[datetime] = None
    budget_head: Optional[str] = None            # Major/Minor/Sub head code
    demand_number: Optional[str] = None          # Demand for grants number
    
    # Treasury Integration (NEW)
    treasury_code: Optional[str] = None          # State treasury code
    ddo_code: Optional[str] = None               # Drawing & Disbursing Officer code
    ddo_name: Optional[str] = None
    
    # Geographic Codes (LGD Standard) (NEW)
    coverage_state_codes: Optional[List[str]] = None   # ISO 3166-2:IN codes
    coverage_district_codes: Optional[List[str]] = None # LGD district codes
    
    # Scheme Classification (NEW)
    css_type: Optional[str] = None               # Central Sector / Centrally Sponsored
    sharing_pattern: Optional[str] = None        # e.g., "60:40" (Centre:State)


class SchemeCreate(SchemeBase):
    pass


class SchemeResponse(SchemeBase):
    id: int
    document_id: Optional[str] = None  # Firebase document ID
    created_at: datetime
    updated_at: datetime
    created_by: Optional[str] = None
    
    class Config:
        from_attributes = True


# ============ Fund Flow Schemas ============
class FundFlowBase(BaseModel):
    """Fund Flow Tracking with PFMS Integration and Installment Tracking"""
    # Identification
    scheme_id: str  # Firebase document ID (string) or legacy int ID
    fund_flow_reference: str             # Unique reference number
    
    # Hierarchy
    from_level: str                      # National/State/District/Department
    to_level: str
    from_entity_code: str                # Ministry code / State code / District code
    to_entity_code: str
    from_entity_name: str
    to_entity_name: str
    
    # Financial Details
    amount: float
    currency: str = "INR"
    
    # PFMS Integration
    pfms_mandate_id: Optional[str] = None
    pfms_transaction_id: Optional[str] = None
    pfms_status: Optional[str] = None    # MANDATE_CREATED, PAYMENT_SUCCESS, etc.
    
    # Banking Details
    from_account_number: Optional[str] = None
    to_account_number: Optional[str] = None
    to_ifsc_code: Optional[str] = None
    payment_mode: str                    # RTGS / NEFT / ECS / Cheque
    utr_number: Optional[str] = None     # Unique Transaction Reference
    
    # Dates & Timing
    sanction_date: datetime
    transfer_date: datetime
    credited_date: Optional[datetime] = None
    
    # Status Tracking
    status: str                          # sanctioned/transferred/credited/failed
    failure_reason: Optional[str] = None
    retry_count: int = 0
    
    # Installment & Release Tracking
    installment_number: int = 1
    total_installments: int = 1
    release_type: str = "FIRST_INSTALLMENT"  # FIRST/SECOND/FINAL/EMERGENCY/SUPPLEMENTARY
    release_order_number: Optional[str] = None
    release_order_date: Optional[datetime] = None
    
    # Conditional Release
    conditional_release: bool = False
    release_conditions: Optional[List[str]] = None  # ["UC_SUBMITTED", "AUDIT_CLEARED"]
    conditions_met: Optional[bool] = None
    
    # Delay Tracking
    expected_transfer_date: Optional[datetime] = None
    delay_days: int = 0
    delay_reason: Optional[str] = None


class FundFlowCreate(FundFlowBase):
    pass


class FundFlowResponse(FundFlowBase):
    id: int
    document_id: Optional[str] = None  # Firebase document ID
    created_at: datetime
    
    # Auto-integration fields
    nodal_agency_updated: Optional[bool] = None
    nodal_agency_id: Optional[str] = None
    nodal_agency_error: Optional[str] = None
    
    class Config:
        from_attributes = True


# ============ Utilization Schemas ============
class UtilizationBase(BaseModel):
    """Utilization Monitoring with UC Tracking"""
    scheme_id: int
    admin_level: str
    allocated_amount: float
    spent_amount: float
    report_date: datetime
    utilization_percentage: float
    
    # Geographic (NEW)
    state_code: Optional[str] = None
    district_code: Optional[str] = None
    
    # UC Tracking (NEW)
    uc_submitted: bool = False
    uc_number: Optional[str] = None
    uc_submission_date: Optional[datetime] = None
    
    # Expenditure Breakdown (NEW)
    capital_expenditure: float = 0.0
    revenue_expenditure: float = 0.0
    administrative_cost: float = 0.0
    beneficiary_payment: float = 0.0
    
    # Unspent Balance (NEW)
    unspent_balance: Optional[float] = None
    refund_to_government: float = 0.0
    
    # Quarter-wise Tracking (NEW)
    quarter: Optional[str] = None        # Q1/Q2/Q3/Q4
    cumulative_spent: Optional[float] = None


class UtilizationCreate(UtilizationBase):
    pass


class UtilizationResponse(UtilizationBase):
    id: int
    
    class Config:
        from_attributes = True


# ============ Anomaly Schemas ============
class AnomalyBase(BaseModel):
    scheme_id: int
    anomaly_type: str
    severity: str  # critical, warning, info
    confidence_score: float
    description: str
    detected_date: datetime


class AnomalyCreate(AnomalyBase):
    pass


class AnomalyResponse(AnomalyBase):
    id: Optional[int] = None
    document_id: Optional[str] = None

    class Config:
        from_attributes = True
    
    class Config:
        from_attributes = True


# ============ Prediction Schemas ============
class FundLapsePredictionBase(BaseModel):
    scheme_id: int
    predicted_lapse_amount: float
    lapse_probability: float
    days_to_lapse: int
    prediction_date: datetime


class FundLapsePredictionCreate(FundLapsePredictionBase):
    pass


class FundLapsePredictionResponse(FundLapsePredictionBase):
    id: int
    
    class Config:
        from_attributes = True


# ============ Optimization Schemas ============
class ReallocationSuggestion(BaseModel):
    from_scheme_id: int
    to_scheme_id: int
    suggested_amount: float
    reason: str
    expected_improvement: float  # percentage


class OptimizationResponse(BaseModel):
    suggestions: List[ReallocationSuggestion]
    total_optimizable_amount: float


# ============ Beneficiary Payment (DBT) Schemas ============
class BeneficiaryPaymentBase(BaseModel):
    """Direct Benefit Transfer Payment Tracking"""
    scheme_id: int
    
    # Beneficiary Identity
    beneficiary_id: str                 # Unique beneficiary ID
    beneficiary_name: str
    aadhaar_number: Optional[str] = None  # Last 4 digits or encrypted
    aadhaar_masked: str                 # XXXX-XXXX-1234
    mobile_number: str
    
    # Banking Details
    bank_account_number: str
    ifsc_code: str
    bank_name: str
    
    # Payment Details
    payment_amount: float
    payment_purpose: str                # Pension / Subsidy / Grant / Wages
    payment_date: datetime
    
    # Transaction References
    transaction_id: str                 # Internal transaction ID
    pfms_transaction_id: Optional[str] = None
    utr_number: Optional[str] = None    # Bank UTR
    npci_ref_id: Optional[str] = None   # NPCI reference for UPI/IMPS
    
    # Verification Status
    aadhaar_verified: bool = False
    aadhaar_verification_date: Optional[datetime] = None
    bank_verified: bool = False
    bank_verification_date: Optional[datetime] = None
    ekyc_status: str = "NOT_DONE"       # NOT_DONE / SUCCESS / FAILED
    
    # Payment Status
    payment_status: str                 # INITIATED / NPCI_PROCESSED / BANK_CREDITED / FAILED
    failure_reason: Optional[str] = None
    retry_attempt: int = 0
    
    # Fraud Detection
    is_duplicate: bool = False
    duplicate_reason: Optional[str] = None
    fraud_risk_score: float = 0.0       # 0.0 to 1.0
    fraud_flags: Optional[List[str]] = None  # ["DUPLICATE_AADHAAR", "SUSPICIOUS_PATTERN"]
    
    # Geographic Details
    state: str
    state_code: str
    district: str
    district_code: str
    block: Optional[str] = None
    village: Optional[str] = None
    pincode: Optional[str] = None
    
    # Audit Trail
    created_by: str
    created_at: datetime
    processed_by: Optional[str] = None
    processed_at: Optional[datetime] = None


class BeneficiaryPaymentCreate(BeneficiaryPaymentBase):
    pass


class BeneficiaryPaymentResponse(BeneficiaryPaymentBase):
    id: int
    document_id: Optional[str] = None  # Firebase document ID
    
    class Config:
        from_attributes = True


class BeneficiaryPaymentSummary(BaseModel):
    """Summary statistics for beneficiary payments"""
    scheme_id: int
    total_beneficiaries: int
    total_amount_disbursed: float
    successful_payments: int
    failed_payments: int
    pending_payments: int
    duplicate_payments_detected: int
    fraud_alerts: int
    aadhaar_verified_count: int
    state_wise_distribution: Dict[str, int]
    district_wise_distribution: Dict[str, int]


# ============ Nodal Agency Monitoring Schemas ============
class NodalAgencyAccountBase(BaseModel):
    """Nodal Agency Account Monitoring"""
    # Account Details
    agency_name: str
    agency_type: str                    # Central Nodal / State Nodal / District Nodal
    account_number: str
    bank_name: str
    branch_name: str
    ifsc_code: str
    
    # Scheme Association
    scheme_id: str  # Firebase document ID (string) or legacy int ID
    scheme_code: str
    
    # Geographic
    state: Optional[str] = None
    state_code: Optional[str] = None
    district: Optional[str] = None
    district_code: Optional[str] = None
    
    # Balance Monitoring
    opening_balance: float
    current_balance: float
    last_credit_amount: Optional[float] = None
    last_debit_amount: Optional[float] = None
    last_transaction_date: Optional[datetime] = None
    last_transaction_type: Optional[str] = None  # CREDIT / DEBIT
    
    # Idle Fund Detection
    idle_days: int = 0
    is_idle: bool = False
    idle_threshold_days: int = 30       # Alert if idle for 30+ days
    balance_threshold: float            # Alert if balance > threshold
    
    # Status
    account_status: str = "Active"      # Active / Idle / Flagged / Closed
    flagged_reason: Optional[str] = None
    flagged_date: Optional[datetime] = None
    
    # Audit
    created_at: datetime
    updated_at: datetime
    created_by: str


class NodalAgencyAccountCreate(NodalAgencyAccountBase):
    pass


class NodalAgencyAccountResponse(NodalAgencyAccountBase):
    id: int
    document_id: Optional[str] = None
    
    class Config:
        from_attributes = True


class NodalAgencyTransaction(BaseModel):
    """Track transactions in nodal agency accounts"""
    nodal_agency_id: int
    transaction_date: datetime
    transaction_type: str               # CREDIT / DEBIT
    amount: float
    transaction_reference: str
    utr_number: Optional[str] = None
    from_account: Optional[str] = None
    to_account: Optional[str] = None
    purpose: str
    balance_after_transaction: float


class NodalAgencyIdleFundAlert(BaseModel):
    """Alert for idle funds in nodal agencies"""
    nodal_agency_id: int
    agency_name: str
    idle_amount: float
    idle_days: int
    scheme_code: str
    alert_severity: str                 # WARNING / CRITICAL
    alert_date: datetime
    action_required: str


# ============ Utilization Certificate Schemas ============
class UtilizationCertificateBase(BaseModel):
    """Utilization Certificate Tracking"""
    # Reference
    uc_number: str                      # Unique UC number
    scheme_id: int
    scheme_code: str
    
    # Administrative Level
    admin_level: str                    # State / District / Department
    state: str
    state_code: str
    district: Optional[str] = None
    district_code: Optional[str] = None
    department: Optional[str] = None
    
    # UC Period
    uc_period_from: datetime
    uc_period_to: datetime
    financial_year: str                 # "2024-2025"
    quarter: str                        # Q1 / Q2 / Q3 / Q4
    
    # Financial Details
    allocated_amount: float
    utilized_amount: float
    unspent_balance: float
    refunded_amount: float = 0.0
    
    # Expenditure Breakdown
    capital_expenditure: float = 0.0
    revenue_expenditure: float = 0.0
    administrative_cost: float = 0.0
    beneficiary_payment: float = 0.0
    
    # UC Submission
    uc_type: str                        # Physical / Digital / Online
    submission_date: datetime
    submitted_by: str
    submitted_by_designation: str
    
    # Due Date Tracking
    due_date: datetime
    is_overdue: bool = False
    overdue_days: int = 0
    
    # Verification
    verification_status: str            # PENDING / UNDER_REVIEW / VERIFIED / REJECTED
    verified_by: Optional[str] = None
    verified_by_designation: Optional[str] = None
    verification_date: Optional[datetime] = None
    verification_remarks: Optional[str] = None
    rejection_reason: Optional[str] = None
    
    # Supporting Documents
    supporting_documents: Optional[List[str]] = None  # Document URLs/IDs
    
    # Impact on Next Release
    blocks_next_release: bool = False
    next_release_blocked_reason: Optional[str] = None
    
    # Audit Trail
    created_at: datetime
    updated_at: datetime


class UtilizationCertificateCreate(UtilizationCertificateBase):
    pass


class UtilizationCertificateResponse(UtilizationCertificateBase):
    id: int
    document_id: Optional[str] = None
    
    class Config:
        from_attributes = True


class UCOverdueAlert(BaseModel):
    """Alert for overdue UCs"""
    uc_id: int
    uc_number: str
    scheme_code: str
    state: str
    district: Optional[str] = None
    due_date: datetime
    overdue_days: int
    allocated_amount: float
    alert_severity: str                 # WARNING / CRITICAL
    next_release_amount_blocked: float


# ============ Convergence Detection Schemas ============
class SchemeConvergenceBase(BaseModel):
    """Track overlapping/convergent scheme funding"""
    primary_scheme_id: int
    secondary_scheme_id: int
    
    # Overlap Details
    overlap_type: str                   # Geographic / Beneficiary / Infrastructure
    overlap_percentage: float
    overlapping_amount: float
    
    # Geographic Overlap
    common_states: List[str]
    common_districts: Optional[List[str]] = None
    
    # Beneficiary Overlap
    common_beneficiaries_count: int = 0
    
    # Detection
    detected_date: datetime
    detection_method: str               # AI / Rule-based / Manual
    confidence_score: float
    
    # Resolution
    resolution_status: str              # Unresolved / Under Review / Resolved
    resolution_action: Optional[str] = None
    resolution_date: Optional[datetime] = None


class SchemeConvergenceCreate(SchemeConvergenceBase):
    pass


class SchemeConvergenceResponse(SchemeConvergenceBase):
    id: int
    document_id: Optional[str] = None
    
    class Config:
        from_attributes = True


# ============ Outcome Monitoring Schemas ============
class SchemeOutcomeBase(BaseModel):
    """Link financial spending to measurable outcomes"""
    scheme_id: int
    state: str
    state_code: str
    district: Optional[str] = None
    district_code: Optional[str] = None
    
    # Financial
    total_spent: float
    reporting_period_start: datetime
    reporting_period_end: datetime
    
    # Outcome Metrics (scheme-specific)
    outcome_indicators: Dict[str, float]  # e.g., {"houses_built": 1500, "jobs_created": 25000}
    target_vs_achieved: Dict[str, dict]   # {"houses": {"target": 2000, "achieved": 1500}}
    
    # Performance
    outcome_efficiency: float             # Outcome per rupee spent
    achievement_percentage: float
    
    # Reporting
    reported_by: str
    reporting_agency: str
    verification_status: str              # Unverified / Verified / Disputed
    reporting_date: datetime


class SchemeOutcomeCreate(SchemeOutcomeBase):
    pass


class SchemeOutcomeResponse(SchemeOutcomeBase):
    id: int
    document_id: Optional[str] = None
    
    class Config:
        from_attributes = True
