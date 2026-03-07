"use client";

import { useState, useEffect, useCallback } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/database/firebase";
import { COLLECTIONS_BETA, STATE_CODE_FULL, type UserProfile } from "./collections-beta";

export interface SchemeBeta {
  id: string;
  scheme_code: string;
  name: string;
  ministry: string;
  budget_allocated: number;
  scheme_type?: string;
  legacy_id?: number;
  department_id?: string;
  status?: string;
}

export interface FundFlowBeta {
  id: string;
  scheme_id: string;
  fund_flow_reference: string;
  from_level: string;
  to_level: string;
  from_entity_code: string;
  to_entity_code: string;
  from_entity_name: string;
  to_entity_name: string;
  amount: number;
  status: string;
  sanction_date: string;
  transfer_date: string;
  created_at?: string;
}

export interface BeneficiaryPaymentBeta {
  id: string;
  scheme_id: number;
  beneficiary_id: string;
  beneficiary_name: string;
  payment_amount: number;
  payment_date: string;
  payment_status: string;
  state: string;
  state_code: string;
  district: string;
  district_code: string;
  department_id?: string;
}

export interface AnomalyBeta {
  id: string;
  scheme_id: number;
  anomaly_type: string;
  severity: string;
  description: string;
  confidence_score?: number;
  detected_date: string;
  department_id?: string;
}

export interface NodalAgencyBeta {
  id: string;
  agency_name: string;
  agency_type: string;
  current_balance: number;
  scheme_id: string;
  scheme_code: string;
  state_code: string;
  idle_days?: number;
  is_idle?: boolean;
  account_status?: string;
  department_id?: string;
}

function matchesState(code: string, stateCode: string) {
  return code === stateCode || code === STATE_CODE_FULL || code === `IN-${stateCode}`;
}

function filterByRole<T>(
  items: T[],
  user: UserProfile,
  getEntityCode: (item: T) => string,
  getDistrictCode: (item: T) => string | undefined,
  getStateCode: (item: T) => string | undefined,
  getDeptId: (item: T) => string | undefined
): T[] {
  if (!user.role) return items;
  switch (user.role) {
    case "CENTRAL_ADMIN":
      return items;
    case "CENTRAL_DEPT":
      if (user.department) {
        return items.filter((i) => getDeptId(i) === user.department || !getDeptId(i));
      }
      return items;
    case "STATE_DDO":
      if (!user.stateCode) return items;
      return items.filter((i) => {
        const code = getEntityCode(i);
        const dist = getDistrictCode(i);
        const state = getStateCode(i);
        return (
          matchesState(code, user.stateCode!) ||
          matchesState(state || "", user.stateCode!) ||
          (dist && dist.startsWith(user.stateCode!))
        );
      });
    case "DISTRICT_DDO":
      if (!user.districtCode) return items;
      return items.filter(
        (i) =>
          getEntityCode(i) === user.districtCode ||
          getDistrictCode(i) === user.districtCode
      );
    default:
      return items;
  }
}

export function useBetaData(userProfile: UserProfile | null) {
  const [schemes, setSchemes] = useState<SchemeBeta[]>([]);
  const [fundFlows, setFundFlows] = useState<FundFlowBeta[]>([]);
  const [payments, setPayments] = useState<BeneficiaryPaymentBeta[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyBeta[]>([]);
  const [nodalAgencies, setNodalAgencies] = useState<NodalAgencyBeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    if (!db) {
      setError("Firebase not connected");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [schemesSnap, flowsSnap, paymentsSnap, anomaliesSnap, agenciesSnap] = await Promise.all([
        getDocs(collection(db, COLLECTIONS_BETA.schemes)),
        getDocs(collection(db, COLLECTIONS_BETA.fundFlows)),
        getDocs(collection(db, COLLECTIONS_BETA.beneficiaryPayments)),
        getDocs(collection(db, COLLECTIONS_BETA.anomalies)),
        getDocs(collection(db, COLLECTIONS_BETA.nodalAgencies)),
      ]);

      const schemesList: SchemeBeta[] = schemesSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as SchemeBeta[];
      const flowsList: FundFlowBeta[] = flowsSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as FundFlowBeta[];
      const paymentsList: BeneficiaryPaymentBeta[] = paymentsSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as BeneficiaryPaymentBeta[];
      const anomaliesList: AnomalyBeta[] = anomaliesSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as AnomalyBeta[];
      const agenciesList: NodalAgencyBeta[] = agenciesSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as NodalAgencyBeta[];

      if (userProfile) {
        setSchemes(
          filterByRole(
            schemesList,
            userProfile,
            () => "",
            () => undefined,
            () => undefined,
            (s) => (s as SchemeBeta).department_id
          )
        );
        setFundFlows(
          filterByRole(
            flowsList,
            userProfile,
            (f) => f.to_entity_code,
            (f) => (f.to_level === "District" ? f.to_entity_code : undefined),
            () => f.to_entity_code,
            () => undefined
          )
        );
        setPayments(
          filterByRole(
            paymentsList,
            userProfile,
            (p) => p.district_code,
            (p) => p.district_code,
            (p) => p.state_code,
            (p) => p.department_id
          )
        );
        setAnomalies(
          filterByRole(
            anomaliesList,
            userProfile,
            () => "",
            () => undefined,
            () => undefined,
            (a) => (a as AnomalyBeta).department_id
          )
        );
        setNodalAgencies(
          filterByRole(
            agenciesList,
            userProfile,
            (n) => n.state_code,
            () => undefined,
            (n) => n.state_code,
            (n) => n.department_id
          )
        );
      } else {
        setSchemes(schemesList);
        setFundFlows(flowsList);
        setPayments(paymentsList);
        setAnomalies(anomaliesList);
        setNodalAgencies(agenciesList);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch beta data");
    } finally {
      setLoading(false);
    }
  }, [userProfile?.uid, userProfile?.role, userProfile?.department, userProfile?.stateCode, userProfile?.districtCode]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return {
    schemes,
    fundFlows,
    payments,
    anomalies,
    nodalAgencies,
    loading,
    error,
    refetch: fetchAll,
  };
}
