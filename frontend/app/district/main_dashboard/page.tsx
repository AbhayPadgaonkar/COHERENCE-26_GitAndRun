"use client";

import React, { useEffect, useState } from "react";
import {
  Building,
  DollarSign,
  Loader2,
  Send,
  RefreshCw,
  MapPin,
  Users,
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

export default function DistrictMainDashboard() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const { schemes, fundFlows, payments, anomalies, loading, error, refetch } = useBetaData(userProfile);

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
            role: d.role || "DISTRICT_DDO",
            department: d.department,
            stateCode: d.jurisdiction?.stateCode,
            districtCode: d.jurisdiction?.districtCode,
          });
        } else {
          setUserProfile({ uid: user.uid, role: "DISTRICT_DDO" });
        }
      } catch {
        setUserProfile({ uid: user.uid, role: "DISTRICT_DDO" });
      }
    });
    return () => unsub();
  }, []);

  const totalPayments = payments.reduce((s, p) => s + (p.payment_amount || 0), 0);
  const chartData = payments.slice(0, 10).map((p) => ({
    name: p.beneficiary_name?.slice(0, 12) + (p.beneficiary_name && p.beneficiary_name.length > 12 ? "…" : ""),
    amount: Math.round((p.payment_amount || 0) / 100000),
  }));

  const formatCrores = (amount: number) => `₹${(amount / 10000000).toFixed(2)} Cr`;
  const formatLakhs = (amount: number) => `₹${(amount / 100000).toFixed(2)} L`;

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20">
      <header className="bg-white/90 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <img src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg" alt="" className="h-10 w-auto" />
            <img src="/PFMS-2.png" alt="" className="h-8 w-auto" />
            <div className="border-l-2 border-gray-200 pl-3">
              <h1 className="text-xl font-extrabold text-[#000080]">LokNidhi</h1>
              <p className="text-[9px] text-[#ea580c] uppercase font-bold">District Authority • Beta Data</p>
            </div>
          </div>
          <Link href="/role-based" className="text-sm text-gray-500 hover:text-[#000080]">Switch Role</Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 pb-6 border-b border-gray-200">
          <div>
            <h2 className="text-3xl font-extrabold text-[#000080]">Welcome, District Authority</h2>
            <p className="text-gray-500 mt-1 flex items-center">
              <MapPin className="w-4 h-4 mr-1" />
              {userProfile?.districtCode || "District"} • Vendor/beneficiary payments
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
                  <CardTitle className="text-sm font-medium text-gray-500">Beneficiary Payments</CardTitle>
                </CardHeader>
                <CardContent><div className="text-2xl font-bold">{payments.length}</div></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Total Disbursed</CardTitle>
                </CardHeader>
                <CardContent><div className="text-2xl font-bold">{formatLakhs(totalPayments)}</div></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Anomalies</CardTitle>
                </CardHeader>
                <CardContent><div className="text-2xl font-bold">{anomalies.length}</div></CardContent>
              </Card>
            </div>

            {chartData.length > 0 && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Payments to Vendors (₹ Lakh)</CardTitle>
                  <CardDescription>From beneficiary_payments-beta</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={{ amount: { label: "Amount (Lakh)" } }} className="h-[280px] w-full">
                    <BarChart data={chartData} margin={{ left: 12, right: 12 }}>
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="amount" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Disburse to Vendor / Beneficiary</CardTitle>
                <CardDescription>Record payment to contractor/vendor (beneficiary_payments-beta)</CardDescription>
              </CardHeader>
              <CardContent>
                <DisburseDistrictForm onSuccess={refetch} />
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}

function DisburseDistrictForm({ onSuccess }: { onSuccess: () => void }) {
  const [schemeId, setSchemeId] = useState<number>(9001);
  const [beneficiaryId, setBeneficiaryId] = useState("");
  const [beneficiaryName, setBeneficiaryName] = useState("");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    const amt = parseFloat(amount);
    if (!beneficiaryId.trim() || !beneficiaryName.trim() || !amt || amt <= 0) {
      setMessage("Fill beneficiary ID, name and amount.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/beneficiaries/payment-beta`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheme_id: schemeId,
          beneficiary_id: beneficiaryId.trim(),
          beneficiary_name: beneficiaryName.trim(),
          payment_amount: amt,
          payment_date: new Date().toISOString(),
          transaction_id: `TXN-DIST-${Date.now()}`,
          state: "Maharashtra",
          state_code: "IN-MH",
          district: "District",
          district_code: "MH-MUM",
        }),
      });
      if (res.ok) {
        setAmount("");
        setBeneficiaryId("");
        setBeneficiaryName("");
        setMessage("Recorded in beneficiary_payments-beta.");
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
        <label className="block text-sm font-medium mb-1">Scheme (legacy_id)</label>
        <select value={schemeId} onChange={(e) => setSchemeId(Number(e.target.value))} className="w-full border rounded px-3 py-2">
          <option value={9001}>9001 - Education</option>
          <option value={9002}>9002 - Health</option>
          <option value={9003}>9003 - PWD</option>
          <option value={9004}>9004 - Rural</option>
          <option value={9005}>9005 - Transport</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Beneficiary ID</label>
        <input value={beneficiaryId} onChange={(e) => setBeneficiaryId(e.target.value)} placeholder="e.g. V-EDU-MH-MUM-006" className="w-full border rounded px-3 py-2" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Beneficiary Name</label>
        <input value={beneficiaryName} onChange={(e) => setBeneficiaryName(e.target.value)} placeholder="Vendor/Contractor name" className="w-full border rounded px-3 py-2" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Amount (INR)</label>
        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 500000" className="w-full border rounded px-3 py-2" />
      </div>
      {message && <p className="text-sm text-gray-600">{message}</p>}
      <Button type="submit" disabled={submitting}>
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
        Record Payment
      </Button>
    </form>
  );
}
