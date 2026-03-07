"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Building,
  DollarSign,
  Loader2,
  Send,
  RefreshCw,
  MapPin,
  ArrowRightLeft,
  ShieldAlert,
  FileText,
  BarChart3,
} from "lucide-react";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/database/firebase";
import { useBetaData, type FundFlowBeta } from "@/lib/useBetaData";
import { type UserProfile } from "@/lib/collections-beta";
import options from "@/lib/options";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis } from "recharts";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

const formatCrores = (amount: number) => `₹${(amount / 10000000).toFixed(2)} Cr`;
const formatDate = (s: string) => (s ? new Date(s).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—");

export default function StateMainDashboard() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const { schemes, fundFlows, payments, anomalies, nodalAgencies, loading, error, refetch } = useBetaData(userProfile);

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
            role: d.role || "STATE_DDO",
            department: d.department,
            stateCode: d.jurisdiction?.stateCode,
            districtCode: d.jurisdiction?.districtCode,
          });
        } else {
          setUserProfile({ uid: user.uid, role: "STATE_DDO" });
        }
      } catch {
        setUserProfile({ uid: user.uid, role: "STATE_DDO" });
      }
    });
    return () => unsub();
  }, []);

  const totalBudget = schemes.reduce((s, x) => s + (x.budget_allocated || 0), 0);
  const districtFlows = fundFlows.filter((f) => f.to_level === "District");
  const showAnomalies = true; // State sees district-level anomalies (upper level)

  const geographyState = options.geography.find((s) => s.state_code === userProfile?.stateCode);
  const districts = geographyState?.districts || [];

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20">
      <header className="bg-white/90 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <img src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg" alt="" className="h-10 w-auto" />
            <img src="/PFMS-2.png" alt="" className="h-8 w-auto" />
            <div className="border-l-2 border-gray-200 pl-3">
              <h1 className="text-xl font-extrabold text-[#000080]">LokNidhi</h1>
              <p className="text-[9px] text-[#138808] uppercase font-bold">
                State Authority • {userProfile?.department || "—"} • {userProfile?.stateCode || "—"}
              </p>
            </div>
          </div>
          <Link href="/role-based" className="text-sm text-gray-500 hover:text-[#000080]">Switch Role</Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-[#000080]">State Dashboard</h2>
            <p className="text-gray-500 text-sm mt-1 flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {geographyState?.state_name || userProfile?.stateCode || "State"} • District disbursement & anomalies
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
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Card className="border-0 bg-gradient-to-br from-[#000080]/5 to-white shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-[#000080]/80">Schemes</CardTitle>
                </CardHeader>
                <CardContent><div className="text-2xl font-bold text-[#000080]">{schemes.length}</div></CardContent>
              </Card>
              <Card className="border-0 bg-gradient-to-br from-emerald-500/10 to-white shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-emerald-700">Budget</CardTitle>
                </CardHeader>
                <CardContent><div className="text-xl font-bold text-emerald-800">{formatCrores(totalBudget)}</div></CardContent>
              </Card>
              <Card className="border-0 bg-gradient-to-br from-amber-500/10 to-white shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-amber-700">District Flows</CardTitle>
                </CardHeader>
                <CardContent><div className="text-2xl font-bold text-amber-800">{districtFlows.length}</div></CardContent>
              </Card>
              <Card className="border-0 bg-gradient-to-br from-red-500/10 to-white shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-red-700">Anomalies</CardTitle>
                </CardHeader>
                <CardContent><div className="text-xl font-bold text-red-800">{anomalies.length}</div></CardContent>
              </Card>
              <Card className="border-0 bg-gradient-to-br from-slate-500/10 to-white shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-slate-700">Nodal</CardTitle>
                </CardHeader>
                <CardContent><div className="text-2xl font-bold text-slate-800">{nodalAgencies.length}</div></CardContent>
              </Card>
            </div>

            {districtFlows.length > 0 && (
              <Card className="border border-slate-200/80 shadow-lg overflow-hidden">
                <CardHeader className="pb-2 bg-gradient-to-r from-[#000080]/5 to-transparent">
                  <CardTitle className="text-base flex items-center gap-2"><BarChart3 className="w-4 h-4 text-[#000080]" /> Disbursement to Districts</CardTitle>
                  <CardDescription>Amount (₹ Cr) sent to each district</CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                  <StateDistrictChart fundFlows={districtFlows} formatCrores={formatCrores} />
                </CardContent>
              </Card>
            )}

            {/* District summary */}
            <Card>
              <CardHeader>
                <CardTitle>Districts in scope</CardTitle>
                <CardDescription>Districts under your state (from options.json)</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="flex flex-wrap gap-2">
                  {districts.map((d) => (
                    <li key={d.district_code} className="px-3 py-1.5 bg-blue-50 text-blue-800 rounded-md text-sm font-medium">
                      {d.district_name} ({d.district_code})
                    </li>
                  ))}
                  {districts.length === 0 && <p className="text-sm text-gray-500">No districts configured for this state.</p>}
                </ul>
              </CardContent>
            </Card>

            {/* Anomalies (State sees district anomalies) */}
            {showAnomalies && anomalies.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><ShieldAlert className="w-5 h-5 text-amber-600" /> District anomalies</CardTitle>
                  <CardDescription>Issues in districts under your state (anomalies-beta)</CardDescription>
                </CardHeader>
                <CardContent>
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
                            <TableCell className="text-sm max-w-md">{a.description}</TableCell>
                            <TableCell>{formatDate(a.detected_date)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Fund flows (disbursement to districts) - list */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><ArrowRightLeft className="w-5 h-5" /> Fund flows to districts</CardTitle>
                <CardDescription>Disbursements State → District (fund_flows-beta)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="w-full overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Reference</TableHead>
                        <TableHead>To district</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Transfer date</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {districtFlows.slice(0, 40).map((f) => (
                        <TableRow key={f.id}>
                          <TableCell className="font-mono text-xs">{f.fund_flow_reference}</TableCell>
                          <TableCell>{f.to_entity_name}</TableCell>
                          <TableCell className="text-right font-semibold">{formatCrores(f.amount)}</TableCell>
                          <TableCell>{formatDate(f.transfer_date)}</TableCell>
                          <TableCell><span className={`text-xs px-2 py-0.5 rounded ${f.status === "credited" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>{f.status}</span></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {districtFlows.length > 40 && <p className="text-xs text-gray-500 mt-2">Showing 40 of {districtFlows.length}</p>}
                </div>
              </CardContent>
            </Card>

            {/* Schemes list */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Building className="w-5 h-5" /> Schemes</CardTitle>
                <CardDescription>Your department schemes (schemes-beta)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="w-full overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead className="text-right">Budget</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {schemes.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell className="font-mono text-xs">{s.scheme_code}</TableCell>
                          <TableCell>{s.name}</TableCell>
                          <TableCell className="text-right font-semibold">{formatCrores(s.budget_allocated || 0)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Nodal agencies */}
            {nodalAgencies.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5" /> Nodal agencies</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="w-full overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Agency</TableHead>
                          <TableHead className="text-right">Balance</TableHead>
                          <TableHead>Idle days</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {nodalAgencies.map((n) => (
                          <TableRow key={n.id}>
                            <TableCell>{n.agency_name}</TableCell>
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
            )}

            <Card>
              <CardHeader>
                <CardTitle>Disburse to District</CardTitle>
                <CardDescription>Record transfer to a district DDO (fund_flows-beta)</CardDescription>
              </CardHeader>
              <CardContent>
                <DisburseStateForm onSuccess={refetch} />
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}

function StateDistrictChart({ fundFlows, formatCrores }: { fundFlows: FundFlowBeta[]; formatCrores: (n: number) => string }) {
  const data = useMemo(() => {
    const byTo: Record<string, number> = {};
    fundFlows.forEach((f) => {
      const key = f.to_entity_name || f.to_entity_code || "Other";
      byTo[key] = (byTo[key] || 0) + (f.amount || 0);
    });
    return Object.entries(byTo).map(([name, amount]) => ({ name: name.replace(" District DDO", "").slice(0, 14), amount: amount / 10000000, full: formatCrores(amount) }));
  }, [fundFlows, formatCrores]);
  if (!data.length) return <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">No district flows</div>;
  return (
    <ChartContainer config={{ amount: { label: "Amount (Cr)", color: "#000080" } }} className="h-[220px] w-full">
      <BarChart data={data} margin={{ left: 8, right: 8 }}>
        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
        <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `₹${v}`} />
        <ChartTooltip content={<ChartTooltipContent formatter={(v) => [data.find((d) => d.amount === v)?.full ?? `${v} Cr`, "Amount"]} />} />
        <Bar dataKey="amount" fill="var(--color-amount)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}

function DisburseStateForm({ onSuccess }: { onSuccess: () => void }) {
  const [schemeId, setSchemeId] = useState("");
  const [districtCode, setDistrictCode] = useState("");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [schemes, setSchemes] = useState<{ id: string; name: string }[]>([]);

  const geographyState = options.geography.find((s) => s.state_code === "MH");
  const districts = geographyState?.districts || [];

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
    if (!schemeId || !districtCode || !amt || amt <= 0) {
      setMessage("Select scheme, district and amount.");
      return;
    }
    const dist = districts.find((d) => d.district_code === districtCode);
    const distName = dist?.district_name || districtCode;
    setSubmitting(true);
    try {
      const { addFundFlow } = await import("@/lib/disbursementDb");
      await addFundFlow({
        scheme_id: schemeId,
        fund_flow_reference: `FF-STATE-${districtCode}-${Date.now()}`,
        from_level: "State",
        to_level: "District",
        from_entity_code: "IN-MH",
        to_entity_code: districtCode,
        from_entity_name: "Maharashtra State DDO",
        to_entity_name: `${distName} District DDO`,
        amount: amt,
        currency: "INR",
        payment_mode: "NEFT",
        sanction_date: new Date().toISOString(),
        transfer_date: new Date().toISOString(),
        credited_date: new Date().toISOString(),
        status: "credited",
        installment_number: 1,
        total_installments: 1,
        release_type: "FIRST_INSTALLMENT",
      });
      setAmount("");
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
        <label className="block text-sm font-medium mb-1">Scheme</label>
        <select value={schemeId} onChange={(e) => setSchemeId(e.target.value)} className="w-full border rounded px-3 py-2 bg-white">
          <option value="">Select</option>
          {schemes.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">District</label>
        <select value={districtCode} onChange={(e) => setDistrictCode(e.target.value)} className="w-full border rounded px-3 py-2 bg-white">
          <option value="">Select</option>
          {districts.map((d) => (
            <option key={d.district_code} value={d.district_code}>{d.district_name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Amount (INR)</label>
        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 10000000" className="w-full border rounded px-3 py-2" />
      </div>
      {message && (
        <p className={`text-sm ${message.startsWith("Recorded") ? "text-green-600" : "text-red-600"}`}>{message}</p>
      )}
      <Button type="submit" disabled={submitting}>
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
        Disburse to District
      </Button>
    </form>
  );
}
