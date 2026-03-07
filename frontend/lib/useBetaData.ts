"use client";

import { useState, useEffect, useCallback } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/database/firebase";
import {
  COLLECTIONS_BETA,
  STATE_CODE_FULL,
  type UserProfile,
} from "./collections-beta";

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
  return (
    code === stateCode || code === STATE_CODE_FULL || code === `IN-${stateCode}`
  );
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
      const [
        schemesSnap,
        flowsSnap,
        paymentsSnap,
        anomaliesSnap,
        agenciesSnap,
      ] = await Promise.all([
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
      const flowsList: FundFlowBeta[] = (
        flowsSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as FundFlowBeta[]
      ).sort((a, b) =>
        (b.created_at || b.transfer_date || "").localeCompare(
          a.created_at || a.transfer_date || "",
        ),
      );
      const paymentsList: BeneficiaryPaymentBeta[] = (
        paymentsSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as BeneficiaryPaymentBeta[]
      ).sort((a, b) =>
        (b.created_at || b.payment_date || "").localeCompare(
          a.created_at || a.payment_date || "",
        ),
      );
      const anomaliesList: AnomalyBeta[] = anomaliesSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as AnomalyBeta[];
      const agenciesList: NodalAgencyBeta[] = agenciesSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as NodalAgencyBeta[];

      if (!userProfile?.role) {
        setSchemes(schemesList);
        setFundFlows(flowsList);
        setPayments(paymentsList);
        setAnomalies(anomaliesList);
        setNodalAgencies(agenciesList);
        return;
      }

      const isCentralAdmin = userProfile.role === "CENTRAL_ADMIN";
      const isCentralDept = userProfile.role === "CENTRAL_DEPT";
      const isStateDdo = userProfile.role === "STATE_DDO";
      const isDistrictDdo = userProfile.role === "DISTRICT_DDO";

      // 1. Schemes: CENTRAL_ADMIN sees all; others only their department
      let filteredSchemes = schemesList;
      if (!isCentralAdmin && userProfile.department) {
        filteredSchemes = schemesList.filter(
          (s) => s.department_id === userProfile.department,
        );
      }
      const schemeIds = new Set(filteredSchemes.map((s) => s.id));
      const legacyIds = new Set(
        filteredSchemes.map((s) => s.legacy_id).filter(Boolean),
      );

      // 2. Flows: by department first (except CENTRAL_ADMIN), then by geography
      let filteredFlows = flowsList;

      // Department filtering (CENTRAL_DEPT, STATE_DDO, DISTRICT_DDO see only their dept's schemes)
      if (!isCentralAdmin && userProfile.department) {
        filteredFlows = flowsList.filter((f) => schemeIds.has(f.scheme_id));
      }

      // Geography filtering
      if (isStateDdo && userProfile.stateCode) {
        filteredFlows = filteredFlows.filter(
          (f) =>
            matchesState(f.from_entity_code, userProfile.stateCode!) ||
            matchesState(f.to_entity_code, userProfile.stateCode!) ||
            (f.to_entity_code &&
              f.to_entity_code.startsWith(userProfile.stateCode!)),
        );
      }
      if (isDistrictDdo && userProfile.districtCode) {
        filteredFlows = filteredFlows.filter(
          (f) =>
            f.to_entity_code === userProfile.districtCode ||
            f.from_entity_code === userProfile.districtCode,
        );
      }

      // 3. Payments: by department (and geography for state/district)
      let filteredPayments = paymentsList;
      if (!isCentralAdmin && userProfile.department) {
        filteredPayments = paymentsList.filter(
          (p) =>
            p.department_id === userProfile.department ||
            (p.scheme_id && legacyIds.has(p.scheme_id)),
        );
      }
      if (isStateDdo && userProfile.stateCode) {
        filteredPayments = filteredPayments.filter(
          (p) =>
            matchesState(p.state_code || "", userProfile.stateCode!) ||
            (p.district_code &&
              p.district_code.startsWith(userProfile.stateCode!)),
        );
      }
      if (isDistrictDdo && userProfile.districtCode) {
        filteredPayments = filteredPayments.filter(
          (p) => p.district_code === userProfile.districtCode,
        );
      }

      // 4. Anomalies: by department first (except CENTRAL_ADMIN), then by geography
      let filteredAnomalies = anomaliesList;
      if (!isCentralAdmin && userProfile.department) {
        filteredAnomalies = anomaliesList.filter(
          (a) => a.department_id === userProfile.department,
        );
      }
      // State/District DDOs see only anomalies for schemes in their geography
      if (isStateDdo && legacyIds.size > 0) {
        filteredAnomalies = filteredAnomalies.filter((a) =>
          legacyIds.has(a.scheme_id),
        );
      }
      if (isDistrictDdo && legacyIds.size > 0) {
        filteredAnomalies = filteredAnomalies.filter((a) =>
          legacyIds.has(a.scheme_id),
        );
      }

      // 5. Nodal agencies: by department and state for state DDO, district for district DDO
      let filteredAgencies = agenciesList;
      if (!isCentralAdmin && userProfile.department) {
        filteredAgencies = agenciesList.filter(
          (n) => n.department_id === userProfile.department,
        );
      }
      if (isStateDdo && userProfile.stateCode) {
        filteredAgencies = filteredAgencies.filter((n) =>
          matchesState(n.state_code || "", userProfile.stateCode!),
        );
      }
      if (isDistrictDdo && userProfile.districtCode) {
        // District DDOs should see nodal agencies only for their district if district_code exists
        filteredAgencies = filteredAgencies.filter(
          (n) =>
            !n.district_code || n.district_code === userProfile.districtCode,
        );
      }

      setSchemes(filteredSchemes);
      setFundFlows(filteredFlows);
      setPayments(filteredPayments);
      setAnomalies(filteredAnomalies);
      setNodalAgencies(filteredAgencies);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch beta data");
    } finally {
      setLoading(false);
    }
  }, [
    userProfile?.uid,
    userProfile?.role,
    userProfile?.department,
    userProfile?.stateCode,
    userProfile?.districtCode,
  ]);

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
