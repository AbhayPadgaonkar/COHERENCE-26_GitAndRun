"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Building,
  DollarSign,
  ShieldAlert,
  Loader2,
  Send,
  RefreshCw,
  FileText,
  ArrowRightLeft,
  Users,
  AlertTriangle,
  BarChart3,
  PieChart as PieChartIcon,
} from "lucide-react";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/database/firebase";
import { useBetaData, type SchemeBeta, type FundFlowBeta, type BeneficiaryPaymentBeta } from "@/lib/useBetaData";
import { type UserProfile } from "@/lib/collections-beta";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis, Pie, PieChart, Cell, Legend } from "recharts";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

const formatCrores = (amount: number) => `₹${(amount / 10000000).toFixed(2)} Cr`;
const formatLakhs = (amount: number) => `₹${(amount / 100000).toFixed(2)} L`;
const formatDate = (s: string) => (s ? new Date(s).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—");

export type AnalyticsCharts = {
  charts: {
    budget_by_scheme: { name: string; budget_cr: number }[];
    payments_by_district: { name: string; value_lakhs: number }[];
    fund_flows_by_route: { route: string; amount_cr: number }[];
  };
  latest: { fund_flows: FundFlowBeta[]; payments: BeneficiaryPaymentBeta[] };
};

export default function CentralMainDashboard() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const { schemes, fundFlows, payments, anomalies, nodalAgencies, loading, error, refetch } = useBetaData(userProfile);
  const [anomalyRunning, setAnomalyRunning] = useState<number | null>(null);
  const [analyticsCharts, setAnalyticsCharts] = useState<AnalyticsCharts | null>(null);

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
  const showAnomalies = true; // Central Admin & Central Dept see anomalies

  const handleRunAnomaly = async (legacyId: number) => {
    setAnomalyRunning(legacyId);
    try {
      const res = await fetch(`${API_BASE}/anomalies/detect-from-beta/${legacyId}?save_to_beta=true`, { method: "POST" });
      if (res.ok) await refetch();
    } finally {
      setAnomalyRunning(null);
    }
  };

  // Fetch analytics from Python backend (DB → analytics → charts)
  useEffect(() => {
    if (!userProfile || loading) return;
    const params = new URLSearchParams();
    if (userProfile.role) params.set("role", userProfile.role);
    if (userProfile.department) params.set("department", userProfile.department);
    if (userProfile.stateCode) params.set("state_code", userProfile.stateCode);
    if (userProfile.districtCode) params.set("district_code", userProfile.districtCode);
    fetch(`${API_BASE}/analytics/charts/beta?${params}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => data?.success && data?.charts && setAnalyticsCharts({ charts: data.charts, latest: data.latest || { fund_flows: [], payments: [] } }))
      .catch(() => {});
  }, [userProfile?.uid, userProfile?.role, userProfile?.department, loading, fundFlows.length, payments.length]);

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20">
      <header className="bg-white/90 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <img src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg" alt="" className="h-10 w-auto" />
            <img src="/PFMS-2.png" alt="" className="h-8 w-auto" />
            <div className="border-l-2 border-gray-200 pl-3">
              <h1 className="text-xl font-extrabold text-[#000080]">LokNidhi</h1>
              <p className="text-[9px] text-[#FF9933] uppercase font-bold">
                {userProfile?.role === "CENTRAL_DEPT" ? `Central Dept • ${userProfile.department || "—"}` : "Central Admin • Overall analytics"}
              </p>
            </div>
          </div>
          <Link href="/role-based" className="text-sm text-gray-500 hover:text-[#000080]">Switch Role</Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-[#000080]">
              {userProfile?.role === "CENTRAL_DEPT" ? "Central Department" : "Central Administration"}
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              {userProfile?.role === "CENTRAL_DEPT"
                ? `Department: ${userProfile.department || "—"} • State & district overview`
                : "Ultra-aggregation across all departments"}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 text-sm">{error}</div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#000080]" />
            <span className="ml-3 text-gray-600">Loading...</span>
          </div>
        ) : (
          <>
            {/* Stats cards with clearer hierarchy */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Card className="border-0 bg-gradient-to-br from-[#000080]/5 to-white shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-[#000080]/80 flex items-center gap-1"><Building className="w-3.5 h-3.5" /> Schemes</CardTitle>
                </CardHeader>
                <CardContent><div className="text-2xl font-bold text-[#000080]">{schemes.length}</div></CardContent>
              </Card>
              <Card className="border-0 bg-gradient-to-br from-emerald-500/10 to-white shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-emerald-700 flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" /> Budget</CardTitle>
                </CardHeader>
                <CardContent><div className="text-xl font-bold text-emerald-800">{formatCrores(totalBudget)}</div></CardContent>
              </Card>
              <Card className="border-0 bg-gradient-to-br from-amber-500/10 to-white shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-amber-700 flex items-center gap-1"><ArrowRightLeft className="w-3.5 h-3.5" /> Fund Flows</CardTitle>
                </CardHeader>
                <CardContent><div className="text-2xl font-bold text-amber-800">{fundFlows.length}</div></CardContent>
              </Card>
              <Card className="border-0 bg-gradient-to-br from-red-500/10 to-white shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-red-700 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> Anomalies</CardTitle>
                </CardHeader>
                <CardContent><div className="text-xl font-bold text-red-800">{criticalCount} critical / {anomalies.length} total</div></CardContent>
              </Card>
              <Card className="border-0 bg-gradient-to-br from-slate-500/10 to-white shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-slate-700 flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> Nodal</CardTitle>
                </CardHeader>
                <CardContent><div className="text-2xl font-bold text-slate-800">{nodalAgencies.length}</div></CardContent>
              </Card>
            </div>

            {/* Analytics charts */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border border-slate-200/80 shadow-lg overflow-hidden">
                <CardHeader className="pb-2 bg-gradient-to-r from-[#000080]/5 to-transparent">
                  <CardTitle className="text-base flex items-center gap-2"><BarChart3 className="w-4 h-4 text-[#000080]" /> Budget by Scheme</CardTitle>
                  <CardDescription>Allocated budget per scheme (₹ Cr)</CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                  <BudgetBySchemeChart schemes={schemes} formatCrores={formatCrores} apiData={analyticsCharts?.charts.budget_by_scheme} />
                </CardContent>
              </Card>
              <Card className="border border-slate-200/80 shadow-lg overflow-hidden">
                <CardHeader className="pb-2 bg-gradient-to-r from-[#138808]/10 to-transparent">
                  <CardTitle className="text-base flex items-center gap-2"><PieChartIcon className="w-4 h-4 text-[#138808]" /> Payments by District</CardTitle>
                  <CardDescription>Disbursement share by district (analytics from Python when backend is on)</CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                  <PaymentsByDistrictChart payments={payments} formatLakhs={formatLakhs} apiData={analyticsCharts?.charts.payments_by_district} />
                </CardContent>
              </Card>
            </div>
            <div className="grid md:grid-cols-1 gap-6">
              <Card className="border border-slate-200/80 shadow-lg overflow-hidden">
                <CardHeader className="pb-2 bg-gradient-to-r from-amber-500/10 to-transparent">
                  <CardTitle className="text-base flex items-center gap-2"><ArrowRightLeft className="w-4 h-4 text-amber-700" /> Fund Flows by Route</CardTitle>
                  <CardDescription>Amount (₹ Cr) by from → to level (analytics from Python when backend is on)</CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                  <FundFlowsByRouteChart fundFlows={fundFlows} formatCrores={formatCrores} apiData={analyticsCharts?.charts.fund_flows_by_route} />
                </CardContent>
              </Card>
            </div>

            {/* Schemes list */}
            <Card>
              <CardHeader>
                <CardTitle>Schemes</CardTitle>
                <CardDescription>All schemes in scope (schemes-beta)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="w-full overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Ministry</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead className="text-right">Budget</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {schemes.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell className="font-mono text-xs">{s.scheme_code}</TableCell>
                          <TableCell>{s.name}</TableCell>
                          <TableCell className="text-gray-600 text-sm">{s.ministry}</TableCell>
                          <TableCell>{s.department_id || "—"}</TableCell>
                          <TableCell className="text-right font-semibold">{formatCrores(s.budget_allocated || 0)}</TableCell>
                          <TableCell><span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-800">{s.status || "Active"}</span></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Fund flows list */}
            <Card>
              <CardHeader>
                <CardTitle>Fund Flows (Transactions)</CardTitle>
                <CardDescription>Disbursements Central → State → District (latest first). Saved directly to DB from this dashboard.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="w-full overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Reference</TableHead>
                        <TableHead>From → To</TableHead>
                        <TableHead>Level</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Transfer date</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fundFlows.slice(0, 50).map((f) => (
                        <TableRow key={f.id}>
                          <TableCell className="font-mono text-xs">{f.fund_flow_reference}</TableCell>
                          <TableCell className="text-sm">{f.from_entity_name} → {f.to_entity_name}</TableCell>
                          <TableCell>{f.from_level} → {f.to_level}</TableCell>
                          <TableCell className="text-right font-semibold">{formatCrores(f.amount)}</TableCell>
                          <TableCell>{formatDate(f.transfer_date)}</TableCell>
                          <TableCell><span className={`text-xs px-2 py-0.5 rounded ${f.status === "credited" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>{f.status}</span></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {fundFlows.length > 50 && <p className="text-xs text-gray-500 mt-2">Showing 50 of {fundFlows.length}</p>}
                </div>
              </CardContent>
            </Card>

            {/* Anomalies (upper level: Central) + Run detection */}
            {showAnomalies && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><ShieldAlert className="w-5 h-5 text-amber-600" /> Anomalies</CardTitle>
                  <CardDescription>Detected issues (anomalies-beta). Run detection per scheme below.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="w-full overflow-x-auto max-h-64 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Type</TableHead>
                          <TableHead>Severity</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Detected</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {anomalies.map((a) => (
                          <TableRow key={a.id}>
                            <TableCell className="font-medium">{a.anomaly_type}</TableCell>
                            <TableCell><span className={`text-xs px-2 py-0.5 rounded ${a.severity === "critical" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"}`}>{a.severity}</span></TableCell>
                            <TableCell className="text-sm max-w-md truncate">{a.description}</TableCell>
                            <TableCell>{formatDate(a.detected_date)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-xs text-gray-500">Run anomaly detection:</span>
                    {schemes.slice(0, 8).map((s) => (
                      <Button key={s.id} size="sm" variant="secondary" disabled={anomalyRunning !== null} onClick={() => s.legacy_id != null && handleRunAnomaly(s.legacy_id)}>
                        {anomalyRunning === s.legacy_id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Run"}
                        {" "}{s.scheme_code}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Beneficiary payments summary table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5" /> Beneficiary / Vendor Payments</CardTitle>
                <CardDescription>From beneficiary_payments-beta (sample)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="w-full overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Transaction ID</TableHead>
                        <TableHead>Beneficiary</TableHead>
                        <TableHead>District</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.slice(0, 30).map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-mono text-xs">{p.beneficiary_id}</TableCell>
                          <TableCell>{p.beneficiary_name}</TableCell>
                          <TableCell>{p.district} ({p.district_code})</TableCell>
                          <TableCell className="text-right">{formatLakhs(p.payment_amount)}</TableCell>
                          <TableCell>{formatDate(p.payment_date)}</TableCell>
                          <TableCell><span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-800">{p.payment_status}</span></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {payments.length > 30 && <p className="text-xs text-gray-500 mt-2">Showing 30 of {payments.length}</p>}
                </div>
              </CardContent>
            </Card>

            {/* Nodal agencies */}
            <Card>
              <CardHeader>
                <CardTitle>Nodal Agencies</CardTitle>
                <CardDescription>State nodal accounts (nodal_agencies-beta)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="w-full overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Agency</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Scheme</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                        <TableHead>Idle days</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {nodalAgencies.map((n) => (
                        <TableRow key={n.id}>
                          <TableCell>{n.agency_name}</TableCell>
                          <TableCell>{n.agency_type}</TableCell>
                          <TableCell className="font-mono text-xs">{n.scheme_code}</TableCell>
                          <TableCell className="text-right font-semibold">{formatCrores(n.current_balance)}</TableCell>
                          <TableCell>{n.idle_days ?? "—"}</TableCell>
                          <TableCell><span className={`text-xs px-2 py-0.5 rounded ${n.account_status === "Flagged" ? "bg-amber-100 text-amber-800" : "bg-gray-100"}`}>{n.account_status || "Active"}</span></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Disburse to State */}
            <Card>
              <CardHeader>
                <CardTitle>Disburse to State</CardTitle>
                <CardDescription>Record fund transfer to State DDO (writes to fund_flows-beta)</CardDescription>
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

const CHART_COLORS = ["#000080", "#138808", "#FF9933", "#8B5CF6", "#0ea5e9", "#64748b"];

function BudgetBySchemeChart({
  schemes,
  formatCrores,
  apiData,
}: {
  schemes: SchemeBeta[];
  formatCrores: (n: number) => string;
  apiData?: { name: string; budget_cr: number }[];
}) {
  const data = useMemo(() => {
    if (apiData?.length) {
      return apiData.slice(0, 8).map((d) => ({ name: d.name, budget: d.budget_cr, full: `₹${d.budget_cr} Cr` }));
    }
    return schemes
      .slice(0, 8)
      .map((s) => ({ name: s.scheme_code || s.name?.slice(0, 12) || s.id, budget: (s.budget_allocated || 0) / 10000000, full: formatCrores(s.budget_allocated || 0) }));
  }, [schemes, formatCrores, apiData]);
  if (!data.length) return <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">No scheme data</div>;
  return (
    <ChartContainer config={{ budget: { label: "Budget (Cr)", color: "#000080" } }} className="h-[220px] w-full">
      <BarChart data={data} margin={{ left: 8, right: 8 }}>
        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
        <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `₹${v}`} />
        <ChartTooltip content={<ChartTooltipContent formatter={(v) => [data.find((d) => d.budget === v)?.full ?? `₹${v} Cr`, "Budget"]} />} />
        <Bar dataKey="budget" fill="var(--color-budget)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}

function PaymentsByDistrictChart({
  payments,
  formatLakhs,
  apiData,
}: {
  payments: BeneficiaryPaymentBeta[];
  formatLakhs: (n: number) => string;
  apiData?: { name: string; value_lakhs: number }[];
}) {
  const data = useMemo(() => {
    if (apiData?.length) {
      return apiData.map((d) => ({ name: d.name, value: d.value_lakhs, full: `₹${d.value_lakhs} L` }));
    }
    const byDistrict: Record<string, number> = {};
    payments.forEach((p) => {
      const key = p.district || p.district_code || "Other";
      byDistrict[key] = (byDistrict[key] || 0) + (p.payment_amount || 0);
    });
    return Object.entries(byDistrict).map(([name, value]) => ({ name: name.slice(0, 14), value: value / 100000, full: formatLakhs(value) }));
  }, [payments, formatLakhs, apiData]);
  if (!data.length) return <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">No payment data</div>;
  return (
    <ChartContainer config={Object.fromEntries(data.map((_, i) => [`fill${i}`, { color: CHART_COLORS[i % CHART_COLORS.length] }]))} className="h-[220px] w-full">
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent formatter={(v, name, _, __, p) => [p?.full ?? formatLakhs((v as number) * 100000), name]} />} />
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} label={({ name }) => name}>
          {data.map((_, i) => <Cell key={i} fill={`var(--color-fill${i})`} />)}
        </Pie>
        <Legend />
      </PieChart>
    </ChartContainer>
  );
}

function FundFlowsByRouteChart({
  fundFlows,
  formatCrores,
  apiData,
}: {
  fundFlows: FundFlowBeta[];
  formatCrores: (n: number) => string;
  apiData?: { route: string; amount_cr: number }[];
}) {
  const data = useMemo(() => {
    if (apiData?.length) {
      return apiData.map((d) => ({ route: d.route, amount: d.amount_cr, full: `₹${d.amount_cr} Cr` }));
    }
    const byRoute: Record<string, number> = {};
    fundFlows.forEach((f) => {
      const key = `${f.from_level} → ${f.to_level}`;
      byRoute[key] = (byRoute[key] || 0) + (f.amount || 0);
    });
    return Object.entries(byRoute).map(([route, amount]) => ({ route, amount: amount / 10000000, full: formatCrores(amount) }));
  }, [fundFlows, formatCrores, apiData]);
  if (!data.length) return <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">No fund flow data</div>;
  return (
    <ChartContainer config={{ amount: { label: "Amount (Cr)", color: "#d97706" } }} className="h-[220px] w-full">
      <BarChart data={data} layout="vertical" margin={{ left: 80, right: 8 }}>
        <XAxis type="number" tickFormatter={(v) => `₹${v}`} />
        <YAxis type="category" dataKey="route" width={75} tick={{ fontSize: 10 }} />
        <ChartTooltip content={<ChartTooltipContent formatter={(v) => [data.find((d) => d.amount === v)?.full ?? `₹${v} Cr`, "Amount"]} />} />
        <Bar dataKey="amount" fill="var(--color-amount)" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ChartContainer>
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
      const { addFundFlow } = await import("@/lib/disbursementDb");
      await addFundFlow({
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
      });
      setAmount("");
      setSchemeId("");
      setMessage("Disbursement saved to database. Latest entry will appear above.");
      onSuccess();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to save to database");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4 max-w-md">
      <div>
        <label className="block text-sm font-medium mb-1">Scheme (document id)</label>
        <select value={schemeId} onChange={(e) => setSchemeId(e.target.value)} className="w-full border rounded px-3 py-2 bg-white">
          <option value="">Select scheme</option>
          {schemes.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Amount (INR)</label>
        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 50000000" className="w-full border rounded px-3 py-2" />
      </div>
      {message && (
        <p className={`text-sm ${message.startsWith("Disbursement recorded") ? "text-green-600" : "text-red-600"}`}>
          {message}
        </p>
      )}
      <Button type="submit" disabled={submitting}>
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
        Disburse to State
      </Button>
    </form>
  );
}
