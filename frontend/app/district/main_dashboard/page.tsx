"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Building,
  Loader2,
  Send,
  RefreshCw,
  MapPin,
  Users,
  ShieldAlert,
  ArrowDownLeft,
  Wallet,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/database/firebase";
import { useBetaData } from "@/lib/useBetaData";
import { type UserProfile } from "@/lib/collections-beta";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis, Cell } from "recharts";

const formatCrores = (amount: number) =>
  `₹${(amount / 10000000).toFixed(2)} Cr`;
const formatLakhs = (amount: number) => `₹${(amount / 100000).toFixed(2)} L`;
const formatDate = (s: string) =>
  s
    ? new Date(s).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const DEPT_LABELS: Record<string, string> = {
  "DEPT-EDU": "Education",
  "DEPT-HLT": "Health",
  "DEPT-PWD": "Public Works",
  "DEPT-RUR": "Rural Development",
  "DEPT-TRN": "Transport",
};

export default function DistrictMainDashboard() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const { schemes, fundFlows, payments, anomalies, loading, error, refetch } =
    useBetaData(userProfile);

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

  const totalDisbursed = payments.reduce(
    (s, p) => s + (p.payment_amount || 0),
    0,
  );
  const totalBudget = schemes.reduce(
    (s, x) => s + (x.budget_allocated || 0),
    0,
  );
  const incomingFlows = fundFlows.filter((f) => f.to_level === "District");
  const incomingTotal = incomingFlows.reduce((s, f) => s + (f.amount || 0), 0);
  const utilizationPct =
    totalBudget > 0 ? Math.min(100, (totalDisbursed / totalBudget) * 100) : 0;
  const canDisburse =
    userProfile?.role === "DISTRICT_DDO" &&
    userProfile?.districtCode &&
    userProfile?.department;
  const departmentName = userProfile?.department
    ? DEPT_LABELS[userProfile.department] || userProfile.department
    : "—";

  const paymentChartData = useMemo(() => {
    const byStatus: Record<string, number> = {};
    payments.forEach((p) => {
      const k = p.payment_status || "Unknown";
      byStatus[k] = (byStatus[k] || 0) + 1;
    });
    return Object.entries(byStatus).map(([name, value]) => ({ name, value }));
  }, [payments]);

  const CHART_COLORS = ["#f97316", "#10b981", "#8b5cf6", "#3b82f6", "#f59e0b"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/60 via-white to-slate-50">
      <header className="bg-white/95 backdrop-blur-md sticky top-0 z-50 border-b border-orange-100 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center max-w-7xl">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg"
                alt="Emblem"
                className="h-9 w-auto"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/PFMS-2.png" alt="PFMS" className="h-7 w-auto" />
            </div>
            <Separator orientation="vertical" className="h-8" />
            <div>
              <h1 className="text-lg font-extrabold text-[#000080] leading-tight">
                LokNidhi
              </h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Badge className="text-[9px] px-1.5 py-0 bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-100 uppercase font-bold tracking-wide">
                  District DDO
                </Badge>
                {departmentName !== "—" && (
                  <Badge
                    variant="outline"
                    className="text-[9px] px-1.5 py-0 text-slate-600 uppercase font-bold tracking-wide"
                  >
                    {departmentName}
                  </Badge>
                )}
                {userProfile?.districtCode && (
                  <Badge
                    variant="outline"
                    className="text-[9px] px-1.5 py-0 text-slate-600 font-bold"
                  >
                    {userProfile.districtCode}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => refetch()}
              disabled={loading}
              className="h-8 w-8 text-gray-400 hover:text-gray-700"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
            </Button>
            <Link href="/role-based">
              <Button
                variant="outline"
                size="sm"
                className="text-xs border-orange-200 text-orange-700 hover:bg-orange-50 gap-1"
              >
                Switch Role <ChevronRight className="w-3 h-3" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-7xl space-y-6">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
            <MapPin className="w-3 h-3 text-orange-400" />
            <span>{userProfile?.districtCode || "District"}</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-orange-600 font-semibold">
              {departmentName}
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900">
            District Dashboard
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Beneficiary payments & incoming fund flows for {departmentName}{" "}
            department
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <ShieldAlert className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="w-12 h-12 animate-spin text-orange-500" />
            <p className="text-sm text-gray-500 font-medium">
              Loading district data…
            </p>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-0 shadow-md bg-white overflow-hidden group hover:shadow-lg transition-all">
                <div className="h-1 bg-gradient-to-r from-[#000080] to-blue-500" />
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                        Schemes
                      </p>
                      <p className="text-3xl font-extrabold text-[#000080] mt-1">
                        {schemes.length}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {departmentName} dept
                      </p>
                    </div>
                    <div className="p-2.5 bg-blue-50 rounded-xl group-hover:bg-blue-100 transition-colors">
                      <Building className="w-5 h-5 text-[#000080]" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md bg-white overflow-hidden group hover:shadow-lg transition-all">
                <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-400" />
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                        Beneficiaries
                      </p>
                      <p className="text-3xl font-extrabold text-emerald-700 mt-1">
                        {payments.length}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        payments recorded
                      </p>
                    </div>
                    <div className="p-2.5 bg-emerald-50 rounded-xl group-hover:bg-emerald-100 transition-colors">
                      <Users className="w-5 h-5 text-emerald-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md bg-white overflow-hidden group hover:shadow-lg transition-all">
                <div className="h-1 bg-gradient-to-r from-orange-500 to-amber-400" />
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                        Total Disbursed
                      </p>
                      <p className="text-xl font-extrabold text-orange-700 mt-1">
                        {formatLakhs(totalDisbursed)}
                      </p>
                    </div>
                    <div className="p-2.5 bg-orange-50 rounded-xl group-hover:bg-orange-100 transition-colors">
                      <Wallet className="w-5 h-5 text-orange-600" />
                    </div>
                  </div>
                  {totalBudget > 0 && (
                    <div className="mt-3">
                      <Progress
                        value={utilizationPct}
                        className="h-1.5 bg-orange-100 [&>div]:bg-orange-500"
                      />
                      <div className="flex justify-between mt-1">
                        <p className="text-[10px] text-gray-400">
                          {utilizationPct.toFixed(1)}% utilized
                        </p>
                        <p className="text-[10px] text-gray-400">
                          {formatCrores(totalBudget)}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md bg-white overflow-hidden group hover:shadow-lg transition-all">
                <div className="h-1 bg-gradient-to-r from-violet-500 to-purple-400" />
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                        Incoming Funds
                      </p>
                      <p className="text-xl font-extrabold text-violet-700 mt-1">
                        {formatCrores(incomingTotal)}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {incomingFlows.length} transfers
                      </p>
                    </div>
                    <div className="p-2.5 bg-violet-50 rounded-xl group-hover:bg-violet-100 transition-colors">
                      <ArrowDownLeft className="w-5 h-5 text-violet-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Chart + Anomalies row */}
            {(paymentChartData.length > 0 || anomalies.length > 0) && (
              <div className="grid md:grid-cols-2 gap-4">
                {paymentChartData.length > 0 && (
                  <Card className="border-0 shadow-md">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-orange-500" />{" "}
                        Payment Status Breakdown
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer
                        config={{ value: { label: "Count", color: "#f97316" } }}
                        className="h-40"
                      >
                        <BarChart
                          data={paymentChartData}
                          margin={{ left: 0, right: 8, top: 4, bottom: 4 }}
                        >
                          <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                            {paymentChartData.map((_, idx) => (
                              <Cell
                                key={idx}
                                fill={CHART_COLORS[idx % CHART_COLORS.length]}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ChartContainer>
                    </CardContent>
                  </Card>
                )}
                {anomalies.length > 0 && (
                  <Card className="border-0 shadow-md border-l-4 border-l-amber-400">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-amber-500" />{" "}
                        Anomalies Detected
                        <Badge className="bg-amber-100 text-amber-800 border-0 ml-auto">
                          {anomalies.length}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {anomalies.slice(0, 4).map((a) => (
                          <div
                            key={a.id}
                            className="flex items-start gap-2 text-xs"
                          >
                            <Badge
                              className={`text-[9px] shrink-0 border-0 ${a.severity === "critical" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}
                            >
                              {a.severity}
                            </Badge>
                            <p className="text-gray-600 line-clamp-1">
                              {a.description}
                            </p>
                          </div>
                        ))}
                        {anomalies.length > 4 && (
                          <p className="text-xs text-gray-400">
                            +{anomalies.length - 4} more
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Tabs */}
            <Tabs defaultValue="payments" className="space-y-4">
              <TabsList className="bg-white border border-gray-100 shadow-sm p-1 rounded-xl h-auto flex-wrap gap-1">
                <TabsTrigger
                  value="payments"
                  className="rounded-lg data-[state=active]:bg-orange-500 data-[state=active]:text-white text-xs font-medium h-8"
                >
                  <Users className="w-3.5 h-3.5 mr-1" /> Payments
                  <Badge
                    variant="secondary"
                    className="ml-1 h-4 px-1 text-[9px]"
                  >
                    {payments.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger
                  value="flows"
                  className="rounded-lg data-[state=active]:bg-violet-600 data-[state=active]:text-white text-xs font-medium h-8"
                >
                  <ArrowDownLeft className="w-3.5 h-3.5 mr-1" /> Incoming Flows
                  <Badge
                    variant="secondary"
                    className="ml-1 h-4 px-1 text-[9px]"
                  >
                    {incomingFlows.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger
                  value="schemes"
                  className="rounded-lg data-[state=active]:bg-[#000080] data-[state=active]:text-white text-xs font-medium h-8"
                >
                  <Building className="w-3.5 h-3.5 mr-1" /> Schemes
                  <Badge
                    variant="secondary"
                    className="ml-1 h-4 px-1 text-[9px]"
                  >
                    {schemes.length}
                  </Badge>
                </TabsTrigger>
                {canDisburse && (
                  <TabsTrigger
                    value="disburse"
                    className="rounded-lg data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-xs font-medium h-8"
                  >
                    <Send className="w-3.5 h-3.5 mr-1" /> Disburse
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="payments">
                <Card className="border-0 shadow-md">
                  <CardHeader className="pb-3 border-b border-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base font-bold flex items-center gap-2">
                          <span className="w-1 h-5 bg-orange-500 rounded-full inline-block" />
                          Beneficiary & Vendor Payments
                        </CardTitle>
                        <CardDescription className="text-xs mt-0.5">
                          All payments in{" "}
                          {userProfile?.districtCode || "district"} for{" "}
                          {departmentName} dept
                        </CardDescription>
                      </div>
                      <Badge variant="secondary" className="font-mono text-xs">
                        {payments.length} records
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[420px]">
                      <Table>
                        <TableHeader className="sticky top-0 bg-gray-50/95 backdrop-blur-sm z-10">
                          <TableRow className="border-b border-gray-200">
                            <TableHead className="text-[11px] font-semibold text-gray-600 w-[160px]">
                              Beneficiary ID
                            </TableHead>
                            <TableHead className="text-[11px] font-semibold text-gray-600">
                              Name
                            </TableHead>
                            <TableHead className="text-[11px] font-semibold text-gray-600 text-right">
                              Amount
                            </TableHead>
                            <TableHead className="text-[11px] font-semibold text-gray-600">
                              Date
                            </TableHead>
                            <TableHead className="text-[11px] font-semibold text-gray-600">
                              Status
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {payments.map((p, i) => (
                            <TableRow
                              key={p.id}
                              className={`border-b border-gray-50 hover:bg-orange-50/50 transition-colors ${i % 2 === 1 ? "bg-gray-50/40" : ""}`}
                            >
                              <TableCell className="font-mono text-xs text-gray-400">
                                {p.beneficiary_id}
                              </TableCell>
                              <TableCell className="font-medium text-sm text-gray-800">
                                {p.beneficiary_name}
                              </TableCell>
                              <TableCell className="text-right font-bold text-emerald-700 text-sm">
                                {formatLakhs(p.payment_amount)}
                              </TableCell>
                              <TableCell className="text-xs text-gray-500">
                                {formatDate(p.payment_date)}
                              </TableCell>
                              <TableCell>
                                <Badge className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-50">
                                  {p.payment_status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                          {payments.length === 0 && (
                            <TableRow>
                              <TableCell
                                colSpan={5}
                                className="text-center text-sm text-gray-400 py-16"
                              >
                                <Users className="w-8 h-8 mx-auto mb-2 text-gray-200" />
                                No payments found for your district &
                                department.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="flows">
                <Card className="border-0 shadow-md">
                  <CardHeader className="pb-3 border-b border-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base font-bold flex items-center gap-2">
                          <span className="w-1 h-5 bg-violet-500 rounded-full inline-block" />
                          Incoming Fund Flows
                        </CardTitle>
                        <CardDescription className="text-xs mt-0.5">
                          Transfers received from State DDO
                        </CardDescription>
                      </div>
                      <Badge variant="secondary" className="font-mono text-xs">
                        {incomingFlows.length} transfers
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[420px]">
                      <Table>
                        <TableHeader className="sticky top-0 bg-gray-50/95 backdrop-blur-sm z-10">
                          <TableRow className="border-b border-gray-200">
                            <TableHead className="text-[11px] font-semibold text-gray-600">
                              Reference
                            </TableHead>
                            <TableHead className="text-[11px] font-semibold text-gray-600">
                              From
                            </TableHead>
                            <TableHead className="text-[11px] font-semibold text-gray-600 text-right">
                              Amount
                            </TableHead>
                            <TableHead className="text-[11px] font-semibold text-gray-600">
                              Date
                            </TableHead>
                            <TableHead className="text-[11px] font-semibold text-gray-600">
                              Status
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {incomingFlows.map((f, i) => (
                            <TableRow
                              key={f.id}
                              className={`border-b border-gray-50 hover:bg-violet-50/50 transition-colors ${i % 2 === 1 ? "bg-gray-50/40" : ""}`}
                            >
                              <TableCell className="font-mono text-xs text-gray-400">
                                {f.fund_flow_reference}
                              </TableCell>
                              <TableCell className="text-sm font-medium text-gray-800">
                                {f.from_entity_name}
                              </TableCell>
                              <TableCell className="text-right font-bold text-violet-700 text-sm">
                                {formatCrores(f.amount)}
                              </TableCell>
                              <TableCell className="text-xs text-gray-500">
                                {formatDate(f.transfer_date)}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  className={`text-[10px] border hover:bg-transparent ${f.status === "credited" ? "bg-green-50 text-green-700 border-green-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}
                                >
                                  {f.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                          {incomingFlows.length === 0 && (
                            <TableRow>
                              <TableCell
                                colSpan={5}
                                className="text-center text-sm text-gray-400 py-16"
                              >
                                <ArrowDownLeft className="w-8 h-8 mx-auto mb-2 text-gray-200" />
                                No incoming flows for your district.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="schemes">
                <Card className="border-0 shadow-md">
                  <CardHeader className="pb-3 border-b border-gray-50">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <span className="w-1 h-5 bg-[#000080] rounded-full inline-block" />
                      Department Schemes
                    </CardTitle>
                    <CardDescription className="text-xs mt-0.5">
                      Active schemes for {departmentName}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader className="bg-gray-50">
                        <TableRow className="border-b border-gray-200">
                          <TableHead className="text-[11px] font-semibold text-gray-600">
                            Code
                          </TableHead>
                          <TableHead className="text-[11px] font-semibold text-gray-600">
                            Name
                          </TableHead>
                          <TableHead className="text-[11px] font-semibold text-gray-600 text-right">
                            Budget
                          </TableHead>
                          <TableHead className="text-[11px] font-semibold text-gray-600">
                            Status
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {schemes.map((s, i) => (
                          <TableRow
                            key={s.id}
                            className={`border-b border-gray-50 hover:bg-blue-50/40 transition-colors ${i % 2 === 1 ? "bg-gray-50/40" : ""}`}
                          >
                            <TableCell className="font-mono text-xs text-gray-400">
                              {s.scheme_code}
                            </TableCell>
                            <TableCell className="font-medium text-sm text-gray-800">
                              {s.name}
                            </TableCell>
                            <TableCell className="text-right font-bold text-[#000080] text-sm">
                              {formatCrores(s.budget_allocated || 0)}
                            </TableCell>
                            <TableCell>
                              <Badge className="text-[10px] bg-green-50 text-green-700 border border-green-200 hover:bg-green-50">
                                {s.status || "Active"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                        {schemes.length === 0 && (
                          <TableRow>
                            <TableCell
                              colSpan={4}
                              className="text-center text-sm text-gray-400 py-10"
                            >
                              No schemes found.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              {canDisburse && (
                <TabsContent value="disburse">
                  <Card className="border-0 shadow-md">
                    <CardHeader className="pb-4 border-b border-gray-50">
                      <CardTitle className="text-base font-bold flex items-center gap-2">
                        <span className="w-1 h-5 bg-emerald-500 rounded-full inline-block" />
                        Disburse to Vendor / Beneficiary
                      </CardTitle>
                      <CardDescription className="text-xs mt-0.5">
                        Record payment for {departmentName} dept in{" "}
                        {userProfile?.districtCode}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-5">
                      <DisburseDistrictForm
                        onSuccess={refetch}
                        userProfile={userProfile}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
            </Tabs>

            {!canDisburse && !loading && (
              <Alert className="border-amber-200 bg-amber-50/60">
                <ShieldAlert className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800 text-sm">
                  <strong>Disbursement locked —</strong>{" "}
                  {!userProfile
                    ? "Please log in."
                    : userProfile.role !== "DISTRICT_DDO"
                      ? `Only District DDO can disburse. Your role: ${userProfile.role}`
                      : !userProfile.districtCode
                        ? "District code not configured in your profile."
                        : "Department not configured in your profile."}
                </AlertDescription>
              </Alert>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function DisburseDistrictForm({
  onSuccess,
  userProfile,
}: {
  onSuccess: () => void;
  userProfile: UserProfile | null;
}) {
  const [schemeId, setSchemeId] = useState<number>(9001);
  const [beneficiaryId, setBeneficiaryId] = useState("");
  const [beneficiaryName, setBeneficiaryName] = useState("");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const districtCode = userProfile?.districtCode || "MH-MUM";
  const stateCode = userProfile?.stateCode || "MH";
  const departmentId = userProfile?.department || "DEPT-EDU";
  const stateCodeFormatted =
    stateCode.length === 2 ? `IN-${stateCode}` : stateCode;

  const SCHEME_OPTIONS = [
    { value: 9001, label: "9001 — Education" },
    { value: 9002, label: "9002 — Health" },
    { value: 9003, label: "9003 — Public Works" },
    { value: 9004, label: "9004 — Rural Development" },
    { value: 9005, label: "9005 — Transport" },
  ];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    const amt = parseFloat(amount);
    if (!beneficiaryId.trim() || !beneficiaryName.trim() || !amt || amt <= 0) {
      setMessage({
        type: "error",
        text: "Fill beneficiary ID, name and a valid amount.",
      });
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
        state_code: stateCodeFormatted,
        district: districtCode,
        district_code: districtCode,
        department_id: departmentId,
      });
      setAmount("");
      setBeneficiaryId("");
      setBeneficiaryName("");
      setMessage({
        type: "success",
        text: "Payment saved. It will appear in the Payments tab.",
      });
      onSuccess();
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to save payment.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5 max-w-lg">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label
            htmlFor="schemeId"
            className="text-xs font-semibold text-gray-600 mb-1.5 block"
          >
            Scheme
          </Label>
          <select
            id="schemeId"
            value={schemeId}
            onChange={(e) => setSchemeId(Number(e.target.value))}
            className="w-full h-9 border border-gray-200 rounded-md px-3 py-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
          >
            {SCHEME_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label
            htmlFor="benefId"
            className="text-xs font-semibold text-gray-600 mb-1.5 block"
          >
            Beneficiary / Vendor ID
          </Label>
          <Input
            id="benefId"
            value={beneficiaryId}
            onChange={(e) => setBeneficiaryId(e.target.value)}
            placeholder="e.g. V-EDU-MH-MUM-006"
            className="h-9 text-sm"
          />
        </div>
        <div>
          <Label
            htmlFor="benefName"
            className="text-xs font-semibold text-gray-600 mb-1.5 block"
          >
            Beneficiary Name
          </Label>
          <Input
            id="benefName"
            value={beneficiaryName}
            onChange={(e) => setBeneficiaryName(e.target.value)}
            placeholder="Contractor / vendor name"
            className="h-9 text-sm"
          />
        </div>
        <div>
          <Label
            htmlFor="amount"
            className="text-xs font-semibold text-gray-600 mb-1.5 block"
          >
            Amount (INR)
          </Label>
          <Input
            id="amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g. 500000"
            className="h-9 text-sm"
          />
        </div>
      </div>

      {message && (
        <Alert
          className={
            message.type === "success"
              ? "border-green-200 bg-green-50"
              : "border-red-200 bg-red-50"
          }
        >
          <AlertDescription
            className={`text-sm ${message.type === "success" ? "text-green-700" : "text-red-700"}`}
          >
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      <Button
        type="submit"
        disabled={submitting}
        className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
      >
        {submitting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Send className="w-4 h-4" />
        )}
        Record Payment
      </Button>
    </form>
  );
}
