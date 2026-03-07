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
  FileText,
} from "lucide-react";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/database/firebase";
import { useBetaData } from "@/lib/useBetaData";
import { type UserProfile } from "@/lib/collections-beta";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

const formatCrores = (amount: number) => `₹${(amount / 10000000).toFixed(2)} Cr`;
const formatLakhs = (amount: number) => `₹${(amount / 100000).toFixed(2)} L`;
const formatDate = (s: string) => (s ? new Date(s).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—");

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

  const totalDisbursed = payments.reduce((s, p) => s + (p.payment_amount || 0), 0);
  const incomingFlows = fundFlows.filter((f) => f.to_level === "District");

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20">
      <header className="bg-white/90 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <img src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg" alt="" className="h-10 w-auto" />
            <img src="/PFMS-2.png" alt="" className="h-8 w-auto" />
            <div className="border-l-2 border-gray-200 pl-3">
              <h1 className="text-xl font-extrabold text-[#000080]">LokNidhi</h1>
              <p className="text-[9px] text-[#ea580c] uppercase font-bold">
                District Authority • {userProfile?.department || "—"} • {userProfile?.districtCode || "—"}
              </p>
            </div>
          </div>
          <Link href="/role-based" className="text-sm text-gray-500 hover:text-[#000080]">Switch Role</Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-[#000080]">District Dashboard</h2>
            <p className="text-gray-500 text-sm mt-1 flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              Your district • Beneficiary/vendor payments only (no anomalies)
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border-0 bg-gradient-to-br from-[#000080]/5 to-white shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-[#000080]/80">Schemes</CardTitle>
                </CardHeader>
                <CardContent><div className="text-2xl font-bold text-[#000080]">{schemes.length}</div></CardContent>
              </Card>
              <Card className="border-0 bg-gradient-to-br from-[#138808]/10 to-white shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-[#138808]">Beneficiaries / Vendors</CardTitle>
                </CardHeader>
                <CardContent><div className="text-2xl font-bold text-[#138808]">{payments.length}</div></CardContent>
              </Card>
              <Card className="border-0 bg-gradient-to-br from-emerald-500/10 to-white shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-emerald-700">Total disbursed</CardTitle>
                </CardHeader>
                <CardContent><div className="text-lg font-bold text-emerald-800">{formatLakhs(totalDisbursed)}</div></CardContent>
              </Card>
              <Card className="border-0 bg-gradient-to-br from-slate-500/10 to-white shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-slate-700">Incoming flows</CardTitle>
                </CardHeader>
                <CardContent><div className="text-xl font-bold text-slate-800">{incomingFlows.length}</div></CardContent>
              </Card>
            </div>

            {/* Beneficiary / vendor payments - main list */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5" /> Beneficiary & vendor payments</CardTitle>
                <CardDescription>All payments in your district for your department (beneficiary_payments-beta)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="w-full overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Beneficiary ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-mono text-xs">{p.beneficiary_id}</TableCell>
                          <TableCell>{p.beneficiary_name}</TableCell>
                          <TableCell className="text-right font-semibold">{formatLakhs(p.payment_amount)}</TableCell>
                          <TableCell>{formatDate(p.payment_date)}</TableCell>
                          <TableCell><span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-800">{p.payment_status}</span></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {payments.length === 0 && <p className="text-sm text-gray-500 py-4 text-center">No payments in your district for your department yet.</p>}
                </div>
              </CardContent>
            </Card>

            {/* Incoming fund flows (State → District) */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5" /> Incoming fund flows</CardTitle>
                <CardDescription>Transfers received from State (fund_flows-beta)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="w-full overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Reference</TableHead>
                        <TableHead>From</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Transfer date</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {incomingFlows.map((f) => (
                        <TableRow key={f.id}>
                          <TableCell className="font-mono text-xs">{f.fund_flow_reference}</TableCell>
                          <TableCell>{f.from_entity_name}</TableCell>
                          <TableCell className="text-right font-semibold">{formatCrores(f.amount)}</TableCell>
                          <TableCell>{formatDate(f.transfer_date)}</TableCell>
                          <TableCell><span className={`text-xs px-2 py-0.5 rounded ${f.status === "credited" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>{f.status}</span></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {incomingFlows.length === 0 && <p className="text-sm text-gray-500 py-4 text-center">No incoming flows for your district.</p>}
                </div>
              </CardContent>
            </Card>

            {/* Schemes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Building className="w-5 h-5" /> Schemes</CardTitle>
                <CardDescription>Your department schemes</CardDescription>
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

            <Card>
              <CardHeader>
                <CardTitle>Disburse to Vendor / Beneficiary</CardTitle>
                <CardDescription>Record payment to contractor/vendor (beneficiary_payments-beta)</CardDescription>
              </CardHeader>
              <CardContent>
                <DisburseDistrictForm onSuccess={refetch} userProfile={userProfile} />
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}

function DisburseDistrictForm({ onSuccess, userProfile }: { onSuccess: () => void; userProfile: UserProfile | null }) {
  const [schemeId, setSchemeId] = useState<number>(9001);
  const [beneficiaryId, setBeneficiaryId] = useState("");
  const [beneficiaryName, setBeneficiaryName] = useState("");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const districtCode = userProfile?.districtCode || "MH-MUM";
  const stateCode = userProfile?.stateCode || "MH";

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
      const { addBeneficiaryPayment } = await import("@/lib/disbursementDb");
      await addBeneficiaryPayment({
        scheme_id: schemeId,
        beneficiary_id: beneficiaryId.trim(),
        beneficiary_name: beneficiaryName.trim(),
        payment_amount: amt,
        payment_date: new Date().toISOString(),
        transaction_id: `TXN-DIST-${Date.now()}`,
        state: "Maharashtra",
        state_code: stateCode.length === 2 ? `IN-${stateCode}` : stateCode,
        district: districtCode,
        district_code: districtCode,
      });
      setAmount("");
      setBeneficiaryId("");
      setBeneficiaryName("");
      setMessage("Payment saved to database. Latest entry will appear above.");
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
        <label className="block text-sm font-medium mb-1">Scheme (legacy_id)</label>
        <select value={schemeId} onChange={(e) => setSchemeId(Number(e.target.value))} className="w-full border rounded px-3 py-2 bg-white">
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
      {message && (
        <p className={`text-sm ${message.startsWith("Recorded") ? "text-green-600" : "text-red-600"}`}>{message}</p>
      )}
      <Button type="submit" disabled={submitting}>
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
        Record Payment
      </Button>
    </form>
  );
}
