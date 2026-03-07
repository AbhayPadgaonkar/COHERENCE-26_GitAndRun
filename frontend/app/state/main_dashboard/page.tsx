"use client";

import React, { useEffect, useState } from "react";
import {
  Building,
  DollarSign,
  AlertCircle,
  TrendingUp,
  Loader2,
  Send,
  RefreshCw,
  MapPin,
} from "lucide-react";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/database/firebase";
import { useBetaData } from "@/lib/useBetaData";
import { type UserProfile } from "@/lib/collections-beta";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis } from "recharts";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

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
  const chartData = districtFlows.slice(0, 8).map((f) => ({
    name: f.to_entity_name?.replace(" District DDO", "") || f.to_entity_code,
    amount: Math.round((f.amount || 0) / 10000000),
  }));

  const formatCrores = (amount: number) => `₹${(amount / 10000000).toFixed(2)} Cr`;

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20">
      <header className="bg-white/90 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <img src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg" alt="" className="h-10 w-auto" />
            <img src="/PFMS-2.png" alt="" className="h-8 w-auto" />
            <div className="border-l-2 border-gray-200 pl-3">
              <h1 className="text-xl font-extrabold text-[#000080]">LokNidhi</h1>
              <p className="text-[9px] text-[#138808] uppercase font-bold">State Authority • Beta Data</p>
            </div>
          </div>
          <Link href="/role-based" className="text-sm text-gray-500 hover:text-[#000080]">Switch Role</Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 pb-6 border-b border-gray-200">
          <div>
            <h2 className="text-3xl font-extrabold text-[#000080]">Welcome, State Authority</h2>
            <p className="text-gray-500 mt-1 flex items-center">
              <MapPin className="w-4 h-4 mr-1" />
              {userProfile?.stateCode || "State"} • District fund distribution
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">{error}</div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#000080]" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Schemes</CardTitle>
                </CardHeader>
                <CardContent><div className="text-2xl font-bold">{schemes.length}</div></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Total Budget</CardTitle>
                </CardHeader>
                <CardContent><div className="text-2xl font-bold">{formatCrores(totalBudget)}</div></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">District Flows</CardTitle>
                </CardHeader>
                <CardContent><div className="text-2xl font-bold">{districtFlows.length}</div></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Nodal Agencies</CardTitle>
                </CardHeader>
                <CardContent><div className="text-2xl font-bold">{nodalAgencies.length}</div></CardContent>
              </Card>
            </div>

            {chartData.length > 0 && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Disbursement to Districts (₹ Cr)</CardTitle>
                  <CardDescription>Fund flows to district DDOs</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={{ amount: { label: "Amount (Cr)" } }} className="h-[280px] w-full">
                    <BarChart data={chartData} margin={{ left: 12, right: 12 }}>
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="amount" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
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

function DisburseStateForm({ onSuccess }: { onSuccess: () => void }) {
  const [schemeId, setSchemeId] = useState("");
  const [districtCode, setDistrictCode] = useState("");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [schemes, setSchemes] = useState<{ id: string; name: string }[]>([]);
  const districts = formData.geography.find((s: { state_code: string }) => s.state_code === "MH")?.districts || [];

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
    const dist = districts.find((d: { district_code: string }) => d.district_code === districtCode);
    const distName = dist?.district_name || districtCode;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/funds/track-beta`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
        }),
      });
      if (res.ok) {
        setAmount("");
        setMessage("Recorded in fund_flows-beta.");
        onSuccess();
      } else {
        setMessage(await res.text() || "Failed");
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
        <label className="block text-sm font-medium mb-1">Scheme</label>
        <select value={schemeId} onChange={(e) => setSchemeId(e.target.value)} className="w-full border rounded px-3 py-2">
          <option value="">Select</option>
          {schemes.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">District</label>
        <select value={districtCode} onChange={(e) => setDistrictCode(e.target.value)} className="w-full border rounded px-3 py-2">
          <option value="">Select</option>
          {districts.map((d: { district_code: string; district_name: string }) => (
            <option key={d.district_code} value={d.district_code}>{d.district_name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Amount (INR)</label>
        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 10000000" className="w-full border rounded px-3 py-2" />
      </div>
      {message && <p className="text-sm text-gray-600">{message}</p>}
      <Button type="submit" disabled={submitting}>
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
        Disburse to District
      </Button>
    </form>
  );
}
