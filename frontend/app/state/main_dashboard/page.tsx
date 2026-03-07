"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Building,
  Loader2,
  Send,
  RefreshCw,
  MapPin,
  ArrowRightLeft,
  ShieldAlert,
  FileText,
  BarChart3,
  ChevronRight,
  TrendingUp,
  Wallet,
  Globe,
} from "lucide-react";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/database/firebase";
import { useBetaData } from "@/lib/useBetaData";
import { type UserProfile } from "@/lib/collections-beta";
import options from "@/lib/options";
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
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  Cell,
  ResponsiveContainer,
} from "recharts";

const formatCrores = (amount: number) =>
  `₹${(amount / 10000000).toFixed(2)} Cr`;
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

const DISTRICT_COLORS = [
  "#138808",
  "#0ea5e9",
  "#8b5cf6",
  "#f97316",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#ec4899",
];

export default function StateMainDashboard() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const {
    schemes,
    fundFlows,
    payments,
    anomalies,
    nodalAgencies,
    loading,
    error,
    refetch,
  } = useBetaData(userProfile);

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

  const totalBudget = schemes.reduce(
    (s, x) => s + (x.budget_allocated || 0),
    0,
  );
  const districtFlows = fundFlows.filter((f) => f.to_level === "District");
  const totalDispatched = districtFlows.reduce(
    (s, f) => s + (f.amount || 0),
    0,
  );

  const geographyState = options.geography.find(
    (s) => s.state_code === userProfile?.stateCode,
  );
  const districts = geographyState?.districts || [];

  const canDisburse =
    userProfile?.role === "STATE_DDO" &&
    userProfile?.stateCode &&
    userProfile?.department;

  const departmentName = userProfile?.department
    ? DEPT_LABELS[userProfile.department] || userProfile.department
    : "—";

  const districtChartData = useMemo(() => {
    const byDistrict: Record<string, number> = {};
    districtFlows.forEach((f) => {
      const key = f.to_entity_name || f.to_entity_code || "Unknown";
      byDistrict[key] = (byDistrict[key] || 0) + f.amount;
    });
    return Object.entries(byDistrict)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, total]) => ({
        name: name.replace(" District DDO", "").replace(" District", ""),
        total: parseFloat((total / 10000000).toFixed(2)),
      }));
  }, [districtFlows]);

  const utilizationPct =
    totalBudget > 0 ? Math.min(100, (totalDispatched / totalBudget) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50/60 via-white to-slate-50">
      <header className="bg-white/95 backdrop-blur-md sticky top-0 z-50 border-b border-emerald-100 shadow-sm">
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
                <Badge className="text-[9px] px-1.5 py-0 bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100 uppercase font-bold tracking-wide">
                  State DDO
                </Badge>
                {departmentName !== "—" && (
                  <Badge
                    variant="outline"
                    className="text-[9px] px-1.5 py-0 text-slate-600 uppercase font-bold tracking-wide"
                  >
                    {departmentName}
                  </Badge>
                )}
                {userProfile?.stateCode && (
                  <Badge
                    variant="outline"
                    className="text-[9px] px-1.5 py-0 text-slate-600 font-bold"
                  >
                    {userProfile.stateCode}
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
                className="text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50 gap-1"
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
            <Globe className="w-3 h-3 text-emerald-400" />
            <span>
              {geographyState?.state_name || userProfile?.stateCode || "State"}
            </span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-emerald-600 font-semibold">
              {departmentName}
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900">
            State Dashboard
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            District disbursements & anomalies for {departmentName} in{" "}
            {geographyState?.state_name || "your state"}
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
            <Loader2 className="w-12 h-12 animate-spin text-emerald-500" />
            <p className="text-sm text-gray-500 font-medium">
              Loading state data…
            </p>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
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
                    </div>
                    <div className="p-2 bg-blue-50 rounded-xl group-hover:bg-blue-100 transition-colors">
                      <Building className="w-4 h-4 text-[#000080]" />
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
                        Budget
                      </p>
                      <p className="text-lg font-extrabold text-emerald-700 mt-1">
                        {formatCrores(totalBudget)}
                      </p>
                    </div>
                    <div className="p-2 bg-emerald-50 rounded-xl group-hover:bg-emerald-100 transition-colors">
                      <Wallet className="w-4 h-4 text-emerald-600" />
                    </div>
                  </div>
                  {utilizationPct > 0 && (
                    <div className="mt-2">
                      <Progress
                        value={utilizationPct}
                        className="h-1 bg-emerald-100 [&>div]:bg-emerald-500"
                      />
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {utilizationPct.toFixed(1)}% dispatched
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md bg-white overflow-hidden group hover:shadow-lg transition-all">
                <div className="h-1 bg-gradient-to-r from-amber-500 to-orange-400" />
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                        District Flows
                      </p>
                      <p className="text-3xl font-extrabold text-amber-700 mt-1">
                        {districtFlows.length}
                      </p>
                    </div>
                    <div className="p-2 bg-amber-50 rounded-xl group-hover:bg-amber-100 transition-colors">
                      <ArrowRightLeft className="w-4 h-4 text-amber-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md bg-white overflow-hidden group hover:shadow-lg transition-all">
                <div className="h-1 bg-gradient-to-r from-red-500 to-rose-400" />
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                        Anomalies
                      </p>
                      <p className="text-3xl font-extrabold text-red-600 mt-1">
                        {anomalies.length}
                      </p>
                    </div>
                    <div className="p-2 bg-red-50 rounded-xl group-hover:bg-red-100 transition-colors">
                      <ShieldAlert className="w-4 h-4 text-red-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md bg-white overflow-hidden group hover:shadow-lg transition-all">
                <div className="h-1 bg-gradient-to-r from-slate-500 to-gray-400" />
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                        Nodal
                      </p>
                      <p className="text-3xl font-extrabold text-slate-700 mt-1">
                        {nodalAgencies.length}
                      </p>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-xl group-hover:bg-slate-100 transition-colors">
                      <FileText className="w-4 h-4 text-slate-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Chart */}
            {districtChartData.length > 0 && (
              <Card className="border-0 shadow-md overflow-hidden">
                <CardHeader className="pb-2 border-b border-gray-50">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-emerald-600" />
                    Disbursement to Districts
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Amount dispatched (₹ Cr) per district
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-3">
                  <ChartContainer
                    config={{
                      total: { label: "Amount (Cr)", color: "#138808" },
                    }}
                    className="h-56"
                  >
                    <BarChart
                      data={districtChartData}
                      margin={{ left: 0, right: 16, top: 4, bottom: 4 }}
                    >
                      <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                      <YAxis
                        tick={{ fontSize: 10 }}
                        tickFormatter={(v) => `₹${v}`}
                      />
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            formatter={(v) => [`₹${v} Cr`, "Amount"]}
                          />
                        }
                      />
                      <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                        {districtChartData.map((_, idx) => (
                          <Cell
                            key={idx}
                            fill={DISTRICT_COLORS[idx % DISTRICT_COLORS.length]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            )}

            {/* Districts grid */}
            {districts.length > 0 && (
              <Card className="border-0 shadow-md">
                <CardHeader className="pb-3 border-b border-gray-50">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-500" />
                    Districts in Scope
                    <Badge variant="secondary" className="ml-auto">
                      {districts.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-3">
                  <div className="flex flex-wrap gap-2">
                    {districts.map((d) => {
                      const hasFlow = districtFlows.some(
                        (f) => f.to_entity_code === d.district_code,
                      );
                      return (
                        <div
                          key={d.district_code}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${hasFlow ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-gray-50 text-gray-500 border-gray-200"}`}
                        >
                          <div
                            className={`w-1.5 h-1.5 rounded-full ${hasFlow ? "bg-emerald-500" : "bg-gray-300"}`}
                          />
                          {d.district_name}
                          <span className="font-mono text-[9px] text-gray-400">
                            ({d.district_code})
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tabs */}
            <Tabs defaultValue="flows" className="space-y-4">
              <TabsList className="bg-white border border-gray-100 shadow-sm p-1 rounded-xl h-auto flex-wrap gap-1">
                <TabsTrigger
                  value="flows"
                  className="rounded-lg data-[state=active]:bg-amber-500 data-[state=active]:text-white text-xs font-medium h-8"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5 mr-1" /> Fund Flows
                  <Badge
                    variant="secondary"
                    className="ml-1 h-4 px-1 text-[9px]"
                  >
                    {districtFlows.length}
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
                {anomalies.length > 0 && (
                  <TabsTrigger
                    value="anomalies"
                    className="rounded-lg data-[state=active]:bg-red-500 data-[state=active]:text-white text-xs font-medium h-8"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 mr-1" /> Anomalies
                    <Badge
                      variant="secondary"
                      className="ml-1 h-4 px-1 text-[9px]"
                    >
                      {anomalies.length}
                    </Badge>
                  </TabsTrigger>
                )}
                {nodalAgencies.length > 0 && (
                  <TabsTrigger
                    value="nodal"
                    className="rounded-lg data-[state=active]:bg-slate-600 data-[state=active]:text-white text-xs font-medium h-8"
                  >
                    <FileText className="w-3.5 h-3.5 mr-1" /> Nodal
                    <Badge
                      variant="secondary"
                      className="ml-1 h-4 px-1 text-[9px]"
                    >
                      {nodalAgencies.length}
                    </Badge>
                  </TabsTrigger>
                )}
                {canDisburse && (
                  <TabsTrigger
                    value="disburse"
                    className="rounded-lg data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-xs font-medium h-8"
                  >
                    <TrendingUp className="w-3.5 h-3.5 mr-1" /> Disburse
                  </TabsTrigger>
                )}
              </TabsList>

              {/* Fund Flows tab */}
              <TabsContent value="flows">
                <Card className="border-0 shadow-md">
                  <CardHeader className="pb-3 border-b border-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base font-bold flex items-center gap-2">
                          <span className="w-1 h-5 bg-amber-500 rounded-full inline-block" />
                          Fund Flows to Districts
                        </CardTitle>
                        <CardDescription className="text-xs mt-0.5">
                          State → District disbursements
                        </CardDescription>
                      </div>
                      <Badge variant="secondary" className="font-mono text-xs">
                        {districtFlows.length} records
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
                              To District
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
                          {districtFlows.slice(0, 50).map((f, i) => (
                            <TableRow
                              key={f.id}
                              className={`border-b border-gray-50 hover:bg-amber-50/40 transition-colors ${i % 2 === 1 ? "bg-gray-50/40" : ""}`}
                            >
                              <TableCell className="font-mono text-xs text-gray-400">
                                {f.fund_flow_reference}
                              </TableCell>
                              <TableCell className="font-medium text-sm text-gray-800">
                                {f.to_entity_name}
                              </TableCell>
                              <TableCell className="text-right font-bold text-amber-700 text-sm">
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
                          {districtFlows.length === 0 && (
                            <TableRow>
                              <TableCell
                                colSpan={5}
                                className="text-center text-sm text-gray-400 py-16"
                              >
                                <ArrowRightLeft className="w-8 h-8 mx-auto mb-2 text-gray-200" />
                                No district fund flows yet.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                      {districtFlows.length > 50 && (
                        <p className="text-xs text-gray-400 text-center py-3">
                          Showing 50 of {districtFlows.length}
                        </p>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Schemes tab */}
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
                          </TableRow>
                        ))}
                        {schemes.length === 0 && (
                          <TableRow>
                            <TableCell
                              colSpan={3}
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

              {/* Anomalies tab */}
              <TabsContent value="anomalies">
                <Card className="border-0 shadow-md border-l-4 border-l-red-400">
                  <CardHeader className="pb-3 border-b border-gray-50">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-bold flex items-center gap-2">
                        <span className="w-1 h-5 bg-red-500 rounded-full inline-block" />
                        District Anomalies
                      </CardTitle>
                      <Badge className="bg-red-100 text-red-700 border-0">
                        {
                          anomalies.filter((a) => a.severity === "critical")
                            .length
                        }{" "}
                        critical
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[360px]">
                      <Table>
                        <TableHeader className="sticky top-0 bg-gray-50/95 backdrop-blur-sm z-10">
                          <TableRow className="border-b border-gray-200">
                            <TableHead className="text-[11px] font-semibold text-gray-600">
                              Type
                            </TableHead>
                            <TableHead className="text-[11px] font-semibold text-gray-600">
                              Severity
                            </TableHead>
                            <TableHead className="text-[11px] font-semibold text-gray-600">
                              Description
                            </TableHead>
                            <TableHead className="text-[11px] font-semibold text-gray-600">
                              Detected
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {anomalies.map((a, i) => (
                            <TableRow
                              key={a.id}
                              className={`border-b border-gray-50 hover:bg-red-50/30 transition-colors ${i % 2 === 1 ? "bg-gray-50/40" : ""}`}
                            >
                              <TableCell className="font-medium text-sm">
                                {a.anomaly_type}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  className={`text-[10px] border-0 ${a.severity === "critical" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}
                                >
                                  {a.severity}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs text-gray-600 max-w-xs">
                                {a.description}
                              </TableCell>
                              <TableCell className="text-xs text-gray-500">
                                {formatDate(a.detected_date)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Nodal agencies tab */}
              <TabsContent value="nodal">
                <Card className="border-0 shadow-md">
                  <CardHeader className="pb-3 border-b border-gray-50">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <span className="w-1 h-5 bg-slate-500 rounded-full inline-block" />
                      Nodal Agencies
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader className="bg-gray-50">
                        <TableRow className="border-b border-gray-200">
                          <TableHead className="text-[11px] font-semibold text-gray-600">
                            Agency
                          </TableHead>
                          <TableHead className="text-[11px] font-semibold text-gray-600 text-right">
                            Balance
                          </TableHead>
                          <TableHead className="text-[11px] font-semibold text-gray-600">
                            Idle Days
                          </TableHead>
                          <TableHead className="text-[11px] font-semibold text-gray-600">
                            Status
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {nodalAgencies.map((n, i) => (
                          <TableRow
                            key={n.id}
                            className={`border-b border-gray-50 hover:bg-slate-50/50 transition-colors ${i % 2 === 1 ? "bg-gray-50/40" : ""}`}
                          >
                            <TableCell className="font-medium text-sm text-gray-800">
                              {n.agency_name}
                            </TableCell>
                            <TableCell className="text-right font-bold text-slate-700 text-sm">
                              {formatCrores(n.current_balance)}
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">
                              {n.idle_days ?? "—"}
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={`text-[10px] border-0 ${n.account_status === "Flagged" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600"}`}
                              >
                                {n.account_status || "Active"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Disburse tab */}
              {canDisburse && (
                <TabsContent value="disburse">
                  <Card className="border-0 shadow-md">
                    <CardHeader className="pb-4 border-b border-gray-50">
                      <CardTitle className="text-base font-bold flex items-center gap-2">
                        <span className="w-1 h-5 bg-emerald-500 rounded-full inline-block" />
                        Disburse to District
                      </CardTitle>
                      <CardDescription className="text-xs mt-0.5">
                        Record fund transfer to a district DDO for{" "}
                        {departmentName} dept
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-5">
                      <DisburseStateForm
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
                    : userProfile.role !== "STATE_DDO"
                      ? `Only State DDO can disburse. Your role: ${userProfile.role}`
                      : !userProfile.stateCode
                        ? "State code not configured in your profile."
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

function DisburseStateForm({
  onSuccess,
  userProfile,
}: {
  onSuccess: () => void;
  userProfile: UserProfile | null;
}) {
  const [schemeId, setSchemeId] = useState("");
  const [districtCode, setDistrictCode] = useState("");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [schemes, setSchemes] = useState<{ id: string; name: string }[]>([]);

  const stateCode = userProfile?.stateCode || "MH";
  const departmentId = userProfile?.department || "DEPT-EDU";
  const geographyState = options.geography.find(
    (s) => s.state_code === stateCode,
  );
  const districts = geographyState?.districts || [];

  useEffect(() => {
    async function load() {
      const { collection, getDocs } = await import("firebase/firestore");
      const { db } = await import("@/database/firebase");
      const snap = await getDocs(collection(db, "schemes-beta"));
      const allSchemes = snap.docs.map((d) => ({
        id: d.id,
        name: (d.data().name as string) || d.id,
        department_id: d.data().department_id,
      }));
      setSchemes(
        departmentId
          ? allSchemes.filter((s) => s.department_id === departmentId)
          : allSchemes,
      );
    }
    load();
  }, [departmentId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    const amt = parseFloat(amount);
    if (!schemeId || !districtCode || !amt || amt <= 0) {
      setMessage({
        type: "error",
        text: "Select scheme, district and enter a valid amount.",
      });
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
        from_entity_code:
          stateCode.length === 2 ? `IN-${stateCode}` : stateCode,
        to_entity_code: districtCode,
        from_entity_name: `${geographyState?.state_name || stateCode} State DDO`,
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
        department_id: departmentId,
      });
      setAmount("");
      setDistrictCode("");
      setMessage({
        type: "success",
        text: "Disbursement saved. It will appear in the Fund Flows tab.",
      });
      onSuccess();
    } catch (err) {
      setMessage({
        type: "error",
        text:
          err instanceof Error ? err.message : "Failed to save disbursement.",
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
            htmlFor="scheme"
            className="text-xs font-semibold text-gray-600 mb-1.5 block"
          >
            Scheme ({schemes.length} available)
          </Label>
          <select
            id="scheme"
            value={schemeId}
            onChange={(e) => setSchemeId(e.target.value)}
            className="w-full h-9 border border-gray-200 rounded-md px-3 py-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
          >
            <option value="">Select scheme…</option>
            {schemes.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label
            htmlFor="district"
            className="text-xs font-semibold text-gray-600 mb-1.5 block"
          >
            Destination District
          </Label>
          <select
            id="district"
            value={districtCode}
            onChange={(e) => setDistrictCode(e.target.value)}
            className="w-full h-9 border border-gray-200 rounded-md px-3 py-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
          >
            <option value="">Select district…</option>
            {districts.map((d) => (
              <option key={d.district_code} value={d.district_code}>
                {d.district_name}
              </option>
            ))}
          </select>
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
            placeholder="e.g. 10000000"
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
        Disburse to District
      </Button>
    </form>
  );
}
