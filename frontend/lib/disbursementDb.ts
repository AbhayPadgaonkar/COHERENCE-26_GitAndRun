/**
 * Direct Firestore writes for disbursements (same schema as seed/backend).
 * Use these instead of Python API so data is saved to DB from frontend.
 */
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/database/firebase";
import { COLLECTIONS_BETA } from "./collections-beta";

export type FundFlowWrite = {
  scheme_id: string;
  fund_flow_reference: string;
  from_level: string;
  to_level: string;
  from_entity_code: string;
  to_entity_code: string;
  from_entity_name: string;
  to_entity_name: string;
  amount: number;
  payment_mode: string;
  sanction_date: string;
  transfer_date: string;
  status: string;
  department_id?: string;
  currency?: string;
  credited_date?: string;
  installment_number?: number;
  total_installments?: number;
  release_type?: string;
};

export type BeneficiaryPaymentWrite = {
  scheme_id: number | string;
  beneficiary_id: string;
  beneficiary_name: string;
  payment_amount: number;
  payment_date: string;
  transaction_id: string;
  state: string;
  state_code: string;
  district: string;
  district_code: string;
  department_id?: string;
  payment_status?: string;
  payment_purpose?: string;
  aadhaar_masked?: string;
  mobile_number?: string;
  bank_account_number?: string;
  ifsc_code?: string;
  bank_name?: string;
};

export async function addFundFlow(data: FundFlowWrite): Promise<string> {
  const col = collection(db, COLLECTIONS_BETA.fundFlows);
  const docRef = await addDoc(col, {
    ...data,
    created_at: new Date().toISOString(),
  });
  return docRef.id;
}

export async function addBeneficiaryPayment(
  data: BeneficiaryPaymentWrite,
): Promise<string> {
  const col = collection(db, COLLECTIONS_BETA.beneficiaryPayments);
  const docRef = await addDoc(col, {
    ...data,
    scheme_id:
      typeof data.scheme_id === "string"
        ? (data.scheme_id as string)
        : data.scheme_id,
    payment_status: data.payment_status ?? "BANK_CREDITED",
    payment_purpose: data.payment_purpose ?? "Grant",
    aadhaar_masked: data.aadhaar_masked ?? "XXXX-XXXX-0000",
    mobile_number: data.mobile_number ?? "9999999999",
    bank_account_number: data.bank_account_number ?? "",
    ifsc_code: data.ifsc_code ?? "SBIN0001234",
    bank_name: data.bank_name ?? "State Bank of India",
    created_by: "frontend",
    created_at: new Date().toISOString(),
  });
  return docRef.id;
}
