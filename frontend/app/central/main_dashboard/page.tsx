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
  Users,
  Globe,
  Play,
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
import { Bar, BarChart, XAxis, YAxis, Cell } from "recharts";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

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

const CHART_COLORS = [
  "#000080",
  "#138808",
  "#FF9933",
  "#8B5CF6",
  "#0ea5e9",
  "#64748b",
];

interface AnalyticsCharts {
  budget_by_scheme?: {
    scheme_id: string;
    name: string;
    budget_allocated: number;
  }[];
  payments_by_district?: {
    district: string;
    total_payments: number;
    amount: number;
  }[];
  fund_flows_by_route?: {
    from_level: string;
    to_level: string;
    count: number;
    total_amount: number;
  }[];
}

export default function CentralMainDashboard() {
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
  const [analyticsData, setAnalyticsData] = useState<AnalyticsCharts | null>(
    null,
  );
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [anomalyRunningId, setAnomalyRunningId] = useState<string | null>(null);
  const [anomalyMsg, setAnomalyMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

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

  useEffect(() => {
    if (!userProfile) return;
    const fetchAnalytics = async () => {
      setAnalyticsLoading(true);
      try {
        const params = new URLSearchParams();
        if (userProfile.department && userProfile.role === "CENTRAL_DEPT") {
          params.set("department_id", userProfile.department);
        }
        const res = await fetch(`${API_BASE}/analytics/charts/beta?${params}`);
        if (res.ok) setAnalyticsData(await res.json());
      } catch {
        // Analytics from Python backend is optional — fall back to Firebase data
      } finally {
        setAnalyticsLoading(false);
      }
    };
    fetchAnalytics();
  }, [userProfile]);

  const totalBudget = schemes.reduce(
    (s, x) => s + (x.budget_allocated || 0),
    0,
  );
  const totalPayments = payments.reduce(
    (s, p) => s + (p.payment_amount || 0),
    0,
  );
  const criticalCount = anomalies.filter(
    (a) => a.severity === "critical",
  ).length;
  const departmentName = userProfile?.department
    ? DEPT_LABELS[userProfile.department] || userProfile.department
    : "All Departments";
  const canDisburse =
    userProfile?.role === "CENTRAL_ADMIN" ||
    (userProfile?.role === "CENTRAL_DEPT" && userProfile?.department);
  const isCentralAdmin = userProfile?.role === "CENTRAL_ADMIN";

  const handleRunAnomaly = async (legacyId: string, schemeId: string) => {
    setAnomalyRunningId(schemeId);
    setAnomalyMsg(null);
    try {
      const res = await fetch(
        `${API_BASE}/anomalies/detect-from-beta/${legacyId}?save_to_beta=true`,
        { method: "POST" },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setAnomalyMsg({
        type: "success",
        text: "Anomaly detection completed. Refresh to see results.",
      });
      refetch();
    } catch (err) {
      setAnomalyMsg({
        type: "error",
        text: err instanceof Error ? err.message : "Detection failed.",
      });
    } finally {
      setAnomalyRunningId(null);
    }
  };

  // Derived chart data from Firebase if API unavailable
  const budgetChartData = useMemo(() => {
    if (analyticsData?.budget_by_scheme)
      return analyticsData.budget_by_scheme.map((s) => ({
        name: s.name.slice(0, 20),
        value: parseFloat((s.budget_allocated / 1e7).toFixed(2)),
      }));
    return schemes.slice(0, 8).map((s) => ({
      name: (s.name || s.scheme_code || "").slice(0, 20),
      value: parseFloat(((s.budget_allocated || 0) / 1e7).toFixed(2)),
    }));
  }, [analyticsData, schemes]);

  const paymentByDistrictData = useMemo(() => {
    if (analyticsData?.payments_by_district)
      return analyticsData.payments_by_district.map((d) => ({
        name: d.district.replace(" District", ""),
        value: parseFloat((d.amount / 1e7).toFixed(2)),
      }));
    const byDistrict: Record<string, number> = {};
    payments.forEach((p) => {
      byDistrict[p.district || "?"] =
        (byDistrict[p.district || "?"] || 0) + (p.payment_amount || 0);
    });
    return Object.entries(byDistrict)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, v]) => ({
        name: name.replace(" District", ""),
        value: parseFloat((v / 1e7).toFixed(2)),
      }));
  }, [analyticsData, payments]);

  const flowsByRouteData = useMemo(() => {
    if (analyticsData?.fund_flows_by_route)
      return analyticsData.fund_flows_by_route.map((r) => ({
        name: `${r.from_level}→${r.to_level}`,
        value: parseFloat((r.total_amount / 1e7).toFixed(2)),
      }));
    const byRoute: Record<string, number> = {};
    fundFlows.forEach((f) => {
      const k = `${f.from_level}→${f.to_level}`;
      byRoute[k] = (byRoute[k] || 0) + f.amount;
    });
    return Object.entries(byRoute)
      .sort((a, b) => b[1] - a[1])
      .map(([name, v]) => ({ name, value: parseFloat((v / 1e7).toFixed(2)) }));
  }, [analyticsData, fundFlows]);

  const utilizationPct =
    totalBudget > 0 ? Math.min(100, (totalPayments / totalBudget) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50/60 via-white to-blue-50/30">
      <header className="bg-white/95 backdrop-blur-md sticky top-0 z-50 border-b border-blue-100 shadow-sm">
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
                <Badge className="text-[9px] px-1.5 py-0 bg-[#000080]/10 text-[#000080] border-[#000080]/20 hover:bg-[#000080]/10 uppercase font-bold tracking-wide">
                  {isCentralAdmin ? "Central Admin" : "Central Dept"}
                </Badge>
                {!isCentralAdmin && userProfile?.department && (
                  <Badge
                    variant="outline"
                    className="text-[9px] px-1.5 py-0 text-slate-600 uppercase font-bold tracking-wide"
                  >
                    {departmentName}
                  </Badge>
                )}
                {isCentralAdmin && (
                  <Badge
                    variant="outline"
                    className="text-[9px] px-1.5 py-0 text-green-700 border-green-200 font-bold"
                  >
                    All India View
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
                className="text-xs border-blue-200 text-[#000080] hover:bg-blue-50 gap-1"
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
            <Globe className="w-3 h-3 text-blue-400" />
            <span>Central Government</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-[#000080] font-semibold">
              {isCentralAdmin ? "National Overview" : departmentName}
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900">
            Central Dashboard
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {isCentralAdmin
              ? "Full national fund flow overview across all departments and states"
              : `Analytics for ${departmentName}`}
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
            <Loader2 className="w-12 h-12 animate-spin text-[#000080]" />
            <p className="text-sm text-gray-500 font-medium">
              Loading national data…
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
                        {utilizationPct.toFixed(1)}% utilized
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md bg-white overflow-hidden group hover:shadow-lg transition-all">
                <div className="h-1 bg-gradient-to-r from-orange-400 to-amber-400" />
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                        Fund Flows
                      </p>
                      <p className="text-3xl font-extrabold text-orange-600 mt-1">
                        {fundFlows.length}
                      </p>
                    </div>
                    <div className="p-2 bg-orange-50 rounded-xl group-hover:bg-orange-100 transition-colors">
                      <ArrowRightLeft className="w-4 h-4 text-orange-500" />
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
                      {criticalCount > 0 && (
                        <p className="text-[10px] text-red-500 mt-0.5">
                          {criticalCount} critical
                        </p>
                      )}
                    </div>
                    <div className="p-2 bg-red-50 rounded-xl group-hover:bg-red-100 transition-colors">
                      <ShieldAlert className="w-4 h-4 text-red-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md bg-white overflow-hidden group hover:shadow-lg transition-all">
                <div className="h-1 bg-gradient-to-r from-violet-500 to-purple-400" />
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                        Payments
                      </p>
                      <p className="text-3xl font-extrabold text-violet-700 mt-1">
                        {payments.length}
                      </p>
                    </div>
                    <div className="p-2 bg-violet-50 rounded-xl group-hover:bg-violet-100 transition-colors">
                      <Users className="w-4 h-4 text-violet-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Analytics Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="border-0 shadow-md overflow-hidden">
                <CardHeader className="pb-2 border-b border-gray-50">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-[#000080]" />
                    Budget by Scheme
                    {analyticsLoading && (
                      <Loader2 className="w-3 h-3 animate-spin text-gray-400 ml-auto" />
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-3">
                  <ChartContainer
                    config={{
                      value: { label: "Budget (₹Cr)", color: "#000080" },
                    }}
                    className="h-52"
                  >
                    <BarChart
                      data={budgetChartData}
                      layout="vertical"
                      margin={{ left: 8, right: 20, top: 4, bottom: 4 }}
                    >
                      <XAxis
                        type="number"
                        tick={{ fontSize: 9 }}
                        tickFormatter={(v) => `₹${v}`}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        tick={{ fontSize: 9 }}
                        width={90}
                      />
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            formatter={(v) => [`₹${v} Cr`, "Budget"]}
                          />
                        }
                      />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {budgetChartData.map((_, idx) => (
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

              <Card className="border-0 shadow-md overflow-hidden">
                <CardHeader className="pb-2 border-b border-gray-50">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    Payments by District
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-3">
                  <ChartContainer
                    config={{
                      value: { label: "Amount (₹Cr)", color: "#138808" },
                    }}
                    className="h-52"
                  >
                    <BarChart
                      data={paymentByDistrictData}
                      margin={{ left: 0, right: 16, top: 4, bottom: 24 }}
                    >
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 8 }}
                        angle={-30}
                        textAnchor="end"
                        interval={0}
                      />
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
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {paymentByDistrictData.map((_, idx) => (
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
            </div>

            {flowsByRouteData.length > 0 && (
              <Card className="border-0 shadow-md overflow-hidden">
                <CardHeader className="pb-2 border-b border-gray-50">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-orange-500" />
                    Fund Flows by Route
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Total amount transferred across each route (₹ Cr)
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-3">
                  <ChartContainer
                    config={{
                      value: { label: "Amount (₹Cr)", color: "#FF9933" },
                    }}
                    className="h-40"
                  >
                    <BarChart
                      data={flowsByRouteData}
                      margin={{ left: 0, right: 16, top: 4, bottom: 4 }}
                    >
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
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
                      <Bar
                        dataKey="value"
                        fill="#FF9933"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            )}

            {/* Main Tabs */}
            <Tabs defaultValue="schemes" className="space-y-4">
              <TabsList className="bg-white border border-gray-100 shadow-sm p-1 rounded-xl h-auto flex-wrap gap-1">
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
                <TabsTrigger
                  value="flows"
                  className="rounded-lg data-[state=active]:bg-orange-500 data-[state=active]:text-white text-xs font-medium h-8"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5 mr-1" /> Fund Flows
                  <Badge
                    variant="secondary"
                    className="ml-1 h-4 px-1 text-[9px]"
                  >
                    {fundFlows.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger
                  value="payments"
                  className="rounded-lg data-[state=active]:bg-violet-600 data-[state=active]:text-white text-xs font-medium h-8"
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
                  value="anomalies"
                  className="rounded-lg data-[state=active]:bg-red-500 data-[state=active]:text-white text-xs font-medium h-8"
                >
                  <ShieldAlert className="w-3.5 h-3.5 mr-1" /> Anomalies
                  {criticalCount > 0 && (
                    <Badge className="ml-1 h-4 px-1 text-[9px] bg-red-700 text-white border-0">
                      {criticalCount}
                    </Badge>
                  )}
                </TabsTrigger>
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
                {canDisburse && (
                  <TabsTrigger
                    value="disburse"
                    className="rounded-lg data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-xs font-medium h-8"
                  >
                    <TrendingUp className="w-3.5 h-3.5 mr-1" /> Disburse
                  </TabsTrigger>
                )}
              </TabsList>

              {/* Schemes */}
              <TabsContent value="schemes">
                <Card className="border-0 shadow-md">
                  <CardHeader className="pb-3 border-b border-gray-50">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-bold flex items-center gap-2">
                        <span className="w-1 h-5 bg-[#000080] rounded-full inline-block" />
                        Active Schemes
                        {isCentralAdmin && (
                          <span className="text-gray-400 font-normal text-xs">
                            (All Departments)
                          </span>
                        )}
                      </CardTitle>
                      <Badge variant="secondary" className="font-mono text-xs">
                        {schemes.length}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[420px]">
                      <Table>
                        <TableHeader className="sticky top-0 bg-gray-50/95 backdrop-blur-sm z-10">
                          <TableRow className="border-b border-gray-200">
                            <TableHead className="text-[11px] font-semibold text-gray-600">
                              Code
                            </TableHead>
                            <TableHead className="text-[11px] font-semibold text-gray-600">
                              Name
                            </TableHead>
                            <TableHead className="text-[11px] font-semibold text-gray-600">
                              Dept
                            </TableHead>
                            <TableHead className="text-[11px] font-semibold text-gray-600 text-right">
                              Budget
                            </TableHead>
                            {isCentralAdmin && (
                              <TableHead className="text-[11px] font-semibold text-gray-600 text-center">
                                Anomaly Detect
                              </TableHead>
                            )}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {schemes.map((s, i) => (
                            <TableRow
                              key={s.id}
                              className={`border-b border-gray-50 hover:bg-blue-50/30 transition-colors ${i % 2 === 1 ? "bg-gray-50/40" : ""}`}
                            >
                              <TableCell className="font-mono text-xs text-gray-400">
                                {s.scheme_code}
                              </TableCell>
                              <TableCell className="font-medium text-sm text-gray-800">
                                {s.name}
                              </TableCell>
                              <TableCell className="text-xs text-gray-500">
                                {DEPT_LABELS[s.department_id || ""] ||
                                  s.department_id ||
                                  "—"}
                              </TableCell>
                              <TableCell className="text-right font-bold text-[#000080] text-sm">
                                {formatCrores(s.budget_allocated || 0)}
                              </TableCell>
                              {isCentralAdmin && (
                                <TableCell className="text-center">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={!!anomalyRunningId}
                                    onClick={() =>
                                      handleRunAnomaly(
                                        (s as unknown as { legacy_id?: string })
                                          .legacy_id || s.id,
                                        s.id,
                                      )
                                    }
                                    className="h-6 text-[10px] px-2 gap-1 border-orange-200 text-orange-700 hover:bg-orange-50"
                                  >
                                    {anomalyRunningId === s.id ? (
                                      <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                    ) : (
                                      <Play className="w-2.5 h-2.5" />
                                    )}
                                    Detect
                                  </Button>
                                </TableCell>
                              )}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                    {anomalyMsg && (
                      <div className="px-4 pb-3">
                        <Alert
                          className={
                            anomalyMsg.type === "success"
                              ? "border-green-200 bg-green-50"
                              : "border-red-200 bg-red-50"
                          }
                        >
                          <AlertDescription
                            className={`text-sm ${anomalyMsg.type === "success" ? "text-green-700" : "text-red-700"}`}
                          >
                            {anomalyMsg.text}
                          </AlertDescription>
                        </Alert>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Fund Flows */}
              <TabsContent value="flows">
                <Card className="border-0 shadow-md">
                  <CardHeader className="pb-3 border-b border-gray-50">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-bold flex items-center gap-2">
                        <span className="w-1 h-5 bg-orange-500 rounded-full inline-block" />
                        All Fund Flows
                      </CardTitle>
                      <Badge variant="secondary" className="font-mono text-xs">
                        {fundFlows.length} records
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
                              Route
                            </TableHead>
                            <TableHead className="text-[11px] font-semibold text-gray-600">
                              From
                            </TableHead>
                            <TableHead className="text-[11px] font-semibold text-gray-600">
                              To
                            </TableHead>
                            <TableHead className="text-[11px] font-semibold text-gray-600 text-right">
                              Amount
                            </TableHead>
                            <TableHead className="text-[11px] font-semibold text-gray-600">
                              Status
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {fundFlows.slice(0, 80).map((f, i) => (
                            <TableRow
                              key={f.id}
                              className={`border-b border-gray-50 hover:bg-orange-50/30 transition-colors ${i % 2 === 1 ? "bg-gray-50/40" : ""}`}
                            >
                              <TableCell className="font-mono text-xs text-gray-400">
                                {f.fund_flow_reference}
                              </TableCell>
                              <TableCell className="text-xs text-gray-500">
                                {f.from_level}→{f.to_level}
                              </TableCell>
                              <TableCell className="text-xs text-gray-700">
                                {f.from_entity_name}
                              </TableCell>
                              <TableCell className="text-xs text-gray-700">
                                {f.to_entity_name}
                              </TableCell>
                              <TableCell className="text-right font-bold text-orange-700 text-sm">
                                {formatCrores(f.amount)}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  className={`text-[10px] border-0 ${f.status === "credited" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}
                                >
                                  {f.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      {fundFlows.length > 80 && (
                        <p className="text-xs text-gray-400 text-center py-3">
                          Showing 80 of {fundFlows.length}
                        </p>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Payments */}
              <TabsContent value="payments">
                <Card className="border-0 shadow-md">
                  <CardHeader className="pb-3 border-b border-gray-50">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-bold flex items-center gap-2">
                        <span className="w-1 h-5 bg-violet-500 rounded-full inline-block" />
                        Beneficiary Payments
                      </CardTitle>
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
                            <TableHead className="text-[11px] font-semibold text-gray-600">
                              Beneficiary
                            </TableHead>
                            <TableHead className="text-[11px] font-semibold text-gray-600">
                              District
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
                          {payments.slice(0, 80).map((p, i) => (
                            <TableRow
                              key={p.id}
                              className={`border-b border-gray-50 hover:bg-violet-50/30 transition-colors ${i % 2 === 1 ? "bg-gray-50/40" : ""}`}
                            >
                              <TableCell className="font-medium text-sm text-gray-800">
                                {p.beneficiary_name || p.beneficiary_id}
                              </TableCell>
                              <TableCell className="text-xs text-gray-500">
                                {p.district}
                              </TableCell>
                              <TableCell className="text-right font-bold text-violet-700 text-sm">
                                ₹
                                {(p.payment_amount || 0).toLocaleString(
                                  "en-IN",
                                )}
                              </TableCell>
                              <TableCell className="text-xs text-gray-500">
                                {formatDate(p.payment_date)}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  className={`text-[10px] border-0 ${p.payment_status === "BANK_CREDITED" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}
                                >
                                  {p.payment_status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      {payments.length > 80 && (
                        <p className="text-xs text-gray-400 text-center py-3">
                          Showing 80 of {payments.length}
                        </p>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Anomalies */}
              <TabsContent value="anomalies">
                <Card className="border-0 shadow-md border-l-4 border-l-red-400">
                  <CardHeader className="pb-3 border-b border-gray-50">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-bold flex items-center gap-2">
                        <span className="w-1 h-5 bg-red-500 rounded-full inline-block" />
                        Detected Anomalies
                      </CardTitle>
                      <div className="flex gap-2">
                        {criticalCount > 0 && (
                          <Badge className="bg-red-100 text-red-700 border-0">
                            {criticalCount} critical
                          </Badge>
                        )}
                        <Badge variant="secondary">
                          {anomalies.length} total
                        </Badge>
                      </div>
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
                              Scheme
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
                              <TableCell className="text-xs text-gray-600 max-w-xs truncate">
                                {a.description}
                              </TableCell>
                              <TableCell className="font-mono text-xs text-gray-400">
                                {a.scheme_id}
                              </TableCell>
                              <TableCell className="text-xs text-gray-500">
                                {formatDate(a.detected_date)}
                              </TableCell>
                            </TableRow>
                          ))}
                          {anomalies.length === 0 && (
                            <TableRow>
                              <TableCell
                                colSpan={5}
                                className="text-center text-sm text-gray-400 py-16"
                              >
                                <ShieldAlert className="w-8 h-8 mx-auto mb-2 text-gray-200" />
                                No anomalies detected.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Nodal agencies */}
              <TabsContent value="nodal">
                <Card className="border-0 shadow-md">
                  <CardHeader className="pb-3 border-b border-gray-50">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-bold flex items-center gap-2">
                        <span className="w-1 h-5 bg-slate-500 rounded-full inline-block" />
                        Nodal Agencies
                      </CardTitle>
                      <Badge variant="secondary">{nodalAgencies.length}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader className="bg-gray-50">
                        <TableRow className="border-b border-gray-200">
                          <TableHead className="text-[11px] font-semibold text-gray-600">
                            Agency
                          </TableHead>
                          <TableHead className="text-[11px] font-semibold text-gray-600">
                            State
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
                            <TableCell className="font-mono text-xs text-gray-400">
                              {n.state_code}
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

              {/* Disburse */}
              {canDisburse && (
                <TabsContent value="disburse">
                  <Card className="border-0 shadow-md">
                    <CardHeader className="pb-4 border-b border-gray-50">
                      <CardTitle className="text-base font-bold flex items-center gap-2">
                        <span className="w-1 h-5 bg-emerald-500 rounded-full inline-block" />
                        Disburse Funds — Central
                      </CardTitle>
                      <CardDescription className="text-xs mt-0.5">
                        Record Central → State fund transfer
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-5">
                      <DisburseCentralForm
                        onSuccess={refetch}
                        userProfile={userProfile}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
            </Tabs>
          </>
        )}
      </main>
    </div>
  );
}

function DisburseCentralForm({
  onSuccess,
  userProfile,
}: {
  onSuccess: () => void;
  userProfile: UserProfile | null;
}) {
  const [schemeId, setSchemeId] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [schemes, setSchemes] = useState<
    { id: string; name: string; department_id?: string }[]
  >([]);

  const isCentralAdmin = userProfile?.role === "CENTRAL_ADMIN";
  const departmentId = userProfile?.department;

  useEffect(() => {
    async function load() {
      const { collection, getDocs } = await import("firebase/firestore");
      const { db } = await import("@/database/firebase");
      const snap = await getDocs(collection(db, "schemes-beta"));
      const all = snap.docs.map((d) => ({
        id: d.id,
        name: (d.data().name as string) || d.id,
        department_id: d.data().department_id as string | undefined,
      }));
      setSchemes(
        isCentralAdmin
          ? all
          : all.filter(
              (s) => !departmentId || s.department_id === departmentId,
            ),
      );
    }
    load();
  }, [isCentralAdmin, departmentId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    const amt = parseFloat(amount);
    if (!schemeId || !stateCode || !amt || amt <= 0) {
      setMessage({
        type: "error",
        text: "Select a scheme, state and enter a valid amount.",
      });
      return;
    }
    const stateInfo = options.geography.find((s) => s.state_code === stateCode);
    const stateName = stateInfo?.state_name || stateCode;
    setSubmitting(true);
    try {
      const { addFundFlow } = await import("@/lib/disbursementDb");
      await addFundFlow({
        scheme_id: schemeId,
        fund_flow_reference: `FF-CENTRAL-${stateCode}-${Date.now()}`,
        from_level: "Central",
        to_level: "State",
        from_entity_code: "CENTRAL",
        to_entity_code: `IN-${stateCode}`,
        from_entity_name: "Central Government",
        to_entity_name: `${stateName} State DDO`,
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
      setStateCode("");
      setMessage({
        type: "success",
        text: "Disbursement recorded. Refresh to see in Fund Flows tab.",
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
            htmlFor="central-scheme"
            className="text-xs font-semibold text-gray-600 mb-1.5 block"
          >
            Scheme ({schemes.length} available)
          </Label>
          <select
            id="central-scheme"
            value={schemeId}
            onChange={(e) => setSchemeId(e.target.value)}
            className="w-full h-9 border border-gray-200 rounded-md px-3 py-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
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
            htmlFor="state-target"
            className="text-xs font-semibold text-gray-600 mb-1.5 block"
          >
            Destination State
          </Label>
          <select
            id="state-target"
            value={stateCode}
            onChange={(e) => setStateCode(e.target.value)}
            className="w-full h-9 border border-gray-200 rounded-md px-3 py-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">Select state…</option>
            {options.geography.map((s) => (
              <option key={s.state_code} value={s.state_code}>
                {s.state_name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label
            htmlFor="central-amount"
            className="text-xs font-semibold text-gray-600 mb-1.5 block"
          >
            Amount (INR)
          </Label>
          <Input
            id="central-amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g. 100000000"
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
        className="bg-[#000080] hover:bg-blue-900 text-white gap-2"
      >
        {submitting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Send className="w-4 h-4" />
        )}
        Disburse to State
      </Button>
    </form>
  );
}
