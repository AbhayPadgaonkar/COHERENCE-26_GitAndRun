/**
 * -beta Firestore collection names. Must match backend seed script and API.
 * Use these for all role-based dashboard reads/writes so data maps to the same DB.
 */
export const COLLECTIONS_BETA = {
  schemes: "schemes-beta",
  fundFlows: "fund_flows-beta",
  beneficiaryPayments: "beneficiary_payments-beta",
  anomalies: "anomalies-beta",
  nodalAgencies: "nodal_agencies-beta",
} as const;

/** Role IDs from frontend options.json */
export const ROLES = {
  CENTRAL_ADMIN: "CENTRAL_ADMIN",
  CENTRAL_DEPT: "CENTRAL_DEPT",
  STATE_DDO: "STATE_DDO",
  DISTRICT_DDO: "DISTRICT_DDO",
} as const;

/** Department IDs from frontend options.json */
export const DEPT_IDS = [
  "DEPT-EDU",
  "DEPT-HLT",
  "DEPT-PWD",
  "DEPT-RUR",
  "DEPT-TRN",
] as const;

/** Maharashtra state code in options = MH; full code in DB = IN-MH */
export const STATE_CODE_FULL = "IN-MH";

export type UserProfile = {
  uid: string;
  role: string;
  department?: string;
  stateCode?: string;
  districtCode?: string;
};
