"use client";

import React, { useEffect, useState } from "react";
import {
  Building,
  DollarSign,
  ShieldAlert,
  AlertCircle,
  TrendingUp,
  Loader2,
  Send,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/database/firebase";
import { useBetaData, type SchemeBeta, type FundFlowBeta, type AnomalyBeta } from "@/lib/useBetaData";
import { type UserProfile } from "@/lib/collections-beta";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis } from "recharts";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export default function CentralMainDashboard() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const { schemes, fundFlows, payments, anomalies, nodalAgencies, loading, error, refetch } = useBetaData(userProfile);
  const [disburseOpen, setDisburseOpen] = useState(false);
  const [anomalyRunning, setAnomalyRunning] = useState<number | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setUserProfile(null);
        return;
      }
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        const d = snap.data();
        if (d) {
          setUserProfile({
            uid: user.uid,
            role: d.role || "CENTRAL_ADMIN",
            department: d.department,
            stateCode: d.jurisdiction?.stateCode,
            districtCode: d.jurisdiction?.districtCode,
          });
        } else {
          setUserProfile({ uid: user.uid, role: "CENTRAL_ADMIN" });
        }
      } catch {
        setUserProfile({ uid: user.uid, role: "CENTRAL_ADMIN" });
      }
    });
    return () => unsub();
  }, []);

  const totalBudget = schemes.reduce((s, x) => s + (x.budget_allocated || 0), 0);
  const criticalCount = anomalies.filter((a) => a.severity === "critical").length;
  const chartData = schemes.slice(0, 8).map((s) => ({
    name: s.name.length > 18 ? s.name.slice(0, 18) + "…" : s.name,
    budget: Math.round((s.budget_allocated || 0) / 10000000),
  }));

  const formatCrores = (amount: number) => `₹${(amount / 10000000).toFixed(2)} Cr`;

  const handleRunAnomaly = async (legacyId: number) => {
    setAnomalyRunning(legacyId);
    try {
      const res = await fetch(
        `${API_BASE}/anomalies/detect-from-beta/${legacyId}?save_to_beta=true`,
        { method: "POST" }
      );
      if (res.ok) {
        await refetch();
      }
    } finally {
      setAnomalyRunning(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20">
      <header className="bg-white/90 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <img src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg" alt="" className="h-10 w-auto" />
            <img src="/PFMS-2.png" alt="" className="h-8 w-auto" />
            <div className="border-l-2 border-gray-200 pl-3">
              <h1 className="text-xl font-extrabold text-[#000080]">LokNidhi</h1>
              <p className="text-[9px] text-[#FF9933] uppercase font-bold">Central • Beta Data</p>
            </div>
          </div>
          <Link href="/role-based" className="text-sm text-gray-500 hover:text-[#000080]">Switch Role</Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 pb-6 border-b border-gray-200">
          <div>
            <h2 className="text-3xl font-extrabold text-[#000080]">Welcome, Central Authority</h2>
            <p className="text-gray-500 mt-1">Role-based view from -beta collections (schemes-beta, fund_flows-beta, etc.)</p>
          </div>
          <div className="flex items-center gap-2 mt-4 md:mt-0">
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">{error}</div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#000080]" />
            <span className="ml-3 text-gray-600">Loading...</span>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Schemes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{schemes.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Total Budget</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCrores(totalBudget)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Critical Anomalies</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{criticalCount}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Fund Flows</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{fundFlows.length}</div>
                </CardContent>
              </Card>
            </div>

            {chartData.length > 0 && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Budget by Scheme (₹ Cr)</CardTitle>
                  <CardDescription>From schemes-beta</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={{ budget: { label: "Budget (Cr)" } }} className="h-[300px] w-full">
                    <BarChart data={chartData} margin={{ left: 12, right: 12 }}>
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="budget" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle>Schemes (-beta)</CardTitle>
                  <CardDescription>Filtered by your role/department</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 max-h-64 overflow-y-auto">
                    {schemes.slice(0, 10).map((s) => (
                      <li key={s.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                        <span className="font-medium text-sm truncate mr-2">{s.name}</span>
                        <span className="text-[#000080] font-semibold text-sm">{formatCrores(s.budget_allocated || 0)}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Anomalies & Run Detection</CardTitle>
                  <CardDescription>From anomalies-beta or run Python backend detection</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 max-h-48 overflow-y-auto mb-4">
                    {anomalies.slice(0, 5).map((a) => (
                      <li key={a.id} className={`p-2 rounded border-l-4 text-sm ${
                        a.severity === "critical" ? "border-red-500 bg-red-50" : "border-yellow-500 bg-yellow-50"
                      }`}>
                        <span className="font-semibold">{a.anomaly_type}</span> — {a.description?.slice(0, 80)}…
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-gray-500 mb-2">Run anomaly detection (backend) for a scheme:</p>
                  <div className="flex flex-wrap gap-2">
                    {schemes.slice(0, 5).map((s) => (
                      <Button
                        key={s.id}
                        size="sm"
                        variant="secondary"
                        disabled={anomalyRunning !== null}
                        onClick={() => s.legacy_id != null && handleRunAnomaly(s.legacy_id)}
                      >
                        {anomalyRunning === s.legacy_id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Run"}
                        {" "}{s.scheme_code}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Disburse to State</CardTitle>
                <CardDescription>Record a fund transfer to State DDO (writes to fund_flows-beta via backend)</CardDescription>
              </CardHeader>
              <CardContent>
                <DisburseCentralForm onSuccess={refetch} />
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}

function DisburseCentralForm({ onSuccess }: { onSuccess: () => void }) {
  const [schemeId, setSchemeId] = useState("");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [schemes, setSchemes] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    async function load() {
      const { collection, getDocs } = await import("firebase/firestore");
      const { db } = await import("@/database/firebase");
      const snap = await getDocs(collection(db, "schemes-beta"));
      setSchemes(snap.docs.map((d) => ({ id: d.id, name: (d.data().name as string) || d.id })));
    }
    load();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    const amt = parseFloat(amount);
    if (!schemeId || !amt || amt <= 0) {
      setMessage("Select scheme and enter amount.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/funds/track-beta`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheme_id: schemeId,
          fund_flow_reference: `FF-MANUAL-${Date.now()}`,
          from_level: "National",
          to_level: "State",
          from_entity_code: "MIN-CENT",
          to_entity_code: "IN-MH",
          from_entity_name: "Central Ministry",
          to_entity_name: "Maharashtra State DDO",
          amount: amt,
          currency: "INR",
          payment_mode: "RTGS",
          sanction_date: new Date().toISOString(),
          transfer_date: new Date().toISOString(),
          credited_date: new Date().toISOString(),
          status: "credited",
          installment_number: 1,
          total_installments: 1,
          release_type: "FIRST_INSTALLMENT",
        }),
      });
      if (res.ok) {
        setAmount("");
        setSchemeId("");
        setMessage("Disbursement recorded in fund_flows-beta.");
        onSuccess();
      } else {
        const t = await res.text();
        setMessage(t || "Failed");
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4 max-w-md">
      <div>
        <label className="block text-sm font-medium mb-1">Scheme (document id)</label>
        <select
          value={schemeId}
          onChange={(e) => setSchemeId(e.target.value)}
          className="w-full border rounded px-3 py-2"
        >
          <option value="">Select scheme</option>
          {schemes.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Amount (INR)</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="e.g. 50000000"
          className="w-full border rounded px-3 py-2"
        />
      </div>
      {message && <p className="text-sm text-gray-600">{message}</p>}
      <Button type="submit" disabled={submitting}>
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
        Disburse to State
      </Button>
    </form>
  );
}
