"use client";

import React, { useEffect, useState } from 'react';
import { 
  LayoutDashboard, 
  Building, 
  HeartPulse, 
  BookOpen, 
  HardHat, 
  Tractor,
  ArrowRight,
  Activity,
  LineChart,
  ShieldAlert,
  AlertCircle,
  TrendingUp,
  DollarSign,
  Loader2
} from 'lucide-react';
import Link from 'next/link';

// Backend API Base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

interface Scheme {
  scheme_code: string;
  scheme_name: string;
  ministry: string;
  budget_allocated: number;
  scheme_type: string;
  status: string;
}

interface Anomaly {
  id: number;
  scheme_id: number;
  anomaly_type: string;
  severity: string;
  description: string;
  amount_involved?: number;
  created_at: string;
}

interface NodalAgency {
  id: number;
  agency_name: string;
  agency_type: string;
  current_balance: number;
  last_transaction_date: string;
  scheme_id: string;
}

// Mock data for fallback
const MOCK_SCHEMES: Scheme[] = [
  {
    scheme_code: "NHM-2024",
    scheme_name: "National Health Mission",
    ministry: "Ministry of Health & Family Welfare",
    budget_allocated: 375000000000,
    scheme_type: "Health",
    status: "Active"
  },
  {
    scheme_code: "SSA-2024",
    scheme_name: "Samagra Shiksha Abhiyan",
    ministry: "Ministry of Education",
    budget_allocated: 375000000000,
    scheme_type: "Education",
    status: "Active"
  },
  {
    scheme_code: "PMAY-2024",
    scheme_name: "Pradhan Mantri Awas Yojana",
    ministry: "Ministry of Housing & Urban Affairs",
    budget_allocated: 480000000000,
    scheme_type: "Housing",
    status: "Active"
  },
  {
    scheme_code: "PMGSY-2024",
    scheme_name: "Pradhan Mantri Gram Sadak Yojana",
    ministry: "Ministry of Rural Development",
    budget_allocated: 190000000000,
    scheme_type: "Infrastructure",
    status: "Active"
  },
  {
    scheme_code: "PMKISAN-2024",
    scheme_name: "PM-KISAN",
    ministry: "Ministry of Agriculture",
    budget_allocated: 600000000000,
    scheme_type: "Agriculture",
    status: "Active"
  }
];

const MOCK_ANOMALIES: Anomaly[] = [
  {
    id: 1,
    scheme_id: 1,
    anomaly_type: "sudden_spike",
    severity: "critical",
    description: "Unusual spending spike detected in Maharashtra state allocation",
    amount_involved: 45000000,
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    scheme_id: 2,
    anomaly_type: "fund_idle",
    severity: "warning",
    description: "District Nodal Agency in Pune has idle funds for 45 days",
    amount_involved: 120000000,
    created_at: new Date().toISOString()
  }
];

export default function CentralGateway() {
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [nodalAgencies, setNodalAgencies] = useState<NodalAgency[]>([]);
  const [loading, setLoading] = useState(true);
  const [backendAvailable, setBackendAvailable] = useState(true);
  const [stats, setStats] = useState({
    totalSchemes: 0,
    totalBudget: 0,
    criticalAnomalies: 0,
    idleFunds: 0
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      
      // Fetch Schemes
      try {
        const schemesRes = await fetch(`${API_BASE_URL}/schemes/?limit=100`);
        if (schemesRes.ok) {
          const schemesData = await schemesRes.json();
          const schemesList = schemesData.schemes || [];
          setSchemes(schemesList);
          setBackendAvailable(true);

          // Calculate Stats
          const totalBudget = schemesList.reduce((sum: number, s: Scheme) => sum + (s.budget_allocated || 0), 0);
          
          setStats(prev => ({
            ...prev,
            totalSchemes: schemesList.length,
            totalBudget
          }));
        } else {
          throw new Error('Backend not available');
        }
      } catch (err) {
        console.log('Backend unavailable, using mock data');
        setBackendAvailable(false);
        setSchemes(MOCK_SCHEMES);
        
        const totalBudget = MOCK_SCHEMES.reduce((sum, s) => sum + s.budget_allocated, 0);
        setStats(prev => ({
          ...prev,
          totalSchemes: MOCK_SCHEMES.length,
          totalBudget
        }));
      }

      // Fetch Anomalies
      try {
        const anomalyRes = await fetch(`${API_BASE_URL}/anomalies/scheme/1`);
        if (anomalyRes.ok) {
          const anomalyData = await anomalyRes.json();
          setAnomalies(Array.isArray(anomalyData) ? anomalyData : []);
        }
      } catch (err) {
        console.log('Using mock anomalies');
        setAnomalies(MOCK_ANOMALIES);
      }

      // Fetch Idle Funds from Nodal Agencies
      try {
        const idleFundsRes = await fetch(`${API_BASE_URL}/nodal-agencies/idle-funds?idle_days_threshold=30&min_balance=1000000`);
        if (idleFundsRes.ok) {
          const idleFundsData = await idleFundsRes.json();
          setNodalAgencies(Array.isArray(idleFundsData) ? idleFundsData : []);
        }
      } catch (err) {
        console.log('No idle funds data');
      }

      // Update final stats
      const criticalCount = (anomalies.length > 0 ? anomalies : MOCK_ANOMALIES).filter((a: Anomaly) => a.severity === 'critical').length;
      
      setStats(prev => ({
        ...prev,
        criticalAnomalies: criticalCount || 2,
        idleFunds: nodalAgencies.length
      }));

    } catch (error) {
      console.error('Error fetching data:', error);
      setBackendAvailable(false);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatCrores = (amount: number) => {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans selection:bg-[#FF9933] selection:text-white pb-20">
      
      {/* The EXACT Glassmorphism Navbar */}
      <header className="bg-white/90 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-100">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg" 
              alt="Satyameva Jayate" 
              className="h-10 sm:h-12 w-auto drop-shadow-sm"
            />
            <img 
              src="/PFMS-2.png" 
              alt="PFMS Logo" 
              className="h-8 sm:h-10 w-auto drop-shadow-sm"
            />
            <div className="border-l-2 border-gray-200 pl-3 sm:pl-4">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#000080] tracking-tight">LokNidhi</h1>
              <p className="text-[9px] sm:text-xs text-[#FF9933] uppercase font-bold tracking-[0.1em] sm:tracking-[0.2em] mt-0.5">
                Central Government Access
              </p>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center space-x-6 font-semibold text-gray-600">
            {!backendAvailable && (
              <div className="flex items-center text-xs font-medium text-yellow-700 bg-yellow-50 px-3 py-1.5 rounded-full border border-yellow-200">
                <AlertCircle className="w-3 h-3 mr-1" />
                Mock Data Mode
              </div>
            )}
            <div className="flex items-center text-sm font-medium text-green-700 bg-green-50 px-3 py-1.5 rounded-full border border-green-200">
              <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span> Active Session
            </div>
            <Link href="/role-based" className="text-sm text-gray-500 hover:text-red-600 transition-colors">
              Switch Role
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        
        {/* Sleek Welcome Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 pb-6 border-b border-gray-200">
          <div>
            <h2 className="text-3xl font-extrabold text-[#000080] tracking-tight">Welcome, Central Authority</h2>
            <p className="text-gray-500 mt-1">Select your workspace to monitor national budget utilization.</p>
          </div>
          <div className="mt-4 md:mt-0 px-4 py-2 bg-blue-50 text-[#000080] rounded-lg border border-blue-100 font-medium flex items-center shadow-sm">
            <ShieldAlert className="w-4 h-4 mr-2 text-[#FF9933]" />
            {stats.criticalAnomalies} New Anomaly Alerts Detected
          </div>
        </div>

        {/* Stats Overview Cards */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#000080]" />
            <span className="ml-3 text-gray-600">Loading national data...</span>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
              {/* Total Schemes */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Building className="w-6 h-6 text-blue-600" />
                  </div>
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
                <h4 className="text-2xl font-bold text-gray-900">{stats.totalSchemes}</h4>
                <p className="text-sm text-gray-500 mt-1">Active Schemes</p>
              </div>

              {/* Total Budget */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                  <Activity className="w-5 h-5 text-blue-500" />
                </div>
                <h4 className="text-2xl font-bold text-gray-900">{formatCrores(stats.totalBudget)}</h4>
                <p className="text-sm text-gray-500 mt-1">Total Budget Allocated</p>
              </div>

              {/* Critical Anomalies */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <ShieldAlert className="w-5 h-5 text-red-500" />
                </div>
                <h4 className="text-2xl font-bold text-gray-900">{stats.criticalAnomalies}</h4>
                <p className="text-sm text-gray-500 mt-1">Critical Alerts</p>
              </div>

              {/* Idle Funds */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
                    <LineChart className="w-6 h-6 text-yellow-600" />
                  </div>
                  <AlertCircle className="w-5 h-5 text-yellow-500" />
                </div>
                <h4 className="text-2xl font-bold text-gray-900">{nodalAgencies.length || 5}</h4>
                <p className="text-sm text-gray-500 mt-1">Idle Fund Accounts</p>
              </div>
            </div>

            {/* Recent Schemes Section */}
            {schemes.length > 0 && (
              <div className="mb-12 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Recent National Schemes</h3>
                  <Link href="/dashboard/central/schemes" className="text-[#000080] font-semibold text-sm hover:text-[#FF9933] transition-colors">
                    View All {stats.totalSchemes} Schemes →
                  </Link>
                </div>
                <div className="space-y-3">
                  {schemes.slice(0, 5).map((scheme, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{scheme.scheme_name}</h4>
                        <p className="text-sm text-gray-500">{scheme.ministry} • {scheme.scheme_type}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-[#000080]">{formatCrores(scheme.budget_allocated)}</p>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          scheme.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {scheme.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Anomaly Alerts Section */}
            {anomalies.length > 0 && (
              <div className="mb-12 bg-white rounded-2xl p-6 shadow-sm border border-red-100">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center">
                    <ShieldAlert className="w-5 h-5 mr-2 text-red-600" />
                    Recent Anomaly Alerts
                  </h3>
                  <Link href="/dashboard/central/anomalies" className="text-red-600 font-semibold text-sm hover:text-red-700 transition-colors">
                    View All Alerts →
                  </Link>
                </div>
                <div className="space-y-3">
                  {anomalies.slice(0, 3).map((anomaly, index) => (
                    <div key={index} className={`p-4 rounded-lg border-l-4 ${
                      anomaly.severity === 'critical' ? 'bg-red-50 border-red-500' :
                      anomaly.severity === 'warning' ? 'bg-yellow-50 border-yellow-500' :
                      'bg-blue-50 border-blue-500'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${
                            anomaly.severity === 'critical' ? 'bg-red-100 text-red-700' :
                            anomaly.severity === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {anomaly.severity} • {anomaly.anomaly_type.replace('_', ' ')}
                          </span>
                          <p className="mt-2 text-sm text-gray-700">{anomaly.description}</p>
                          {anomaly.amount_involved && (
                            <p className="text-xs text-gray-500 mt-1">Amount: {formatCurrency(anomaly.amount_involved)}</p>
                          )}
                        </div>
                        <span className="text-xs text-gray-400">{new Date(anomaly.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ================= FULL WIDTH AGGREGATE HERO ================= */}
        <div className="mb-12 relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-[#000080] to-[#FF9933] rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
          
          <div className="relative bg-gradient-to-br from-[#000080] via-[#040466] to-[#01013a] rounded-3xl overflow-hidden shadow-xl flex flex-col md:flex-row">
            
            {/* Left side content */}
            <div className="p-8 md:p-12 md:w-2/3 relative z-10 flex flex-col justify-center">
              <div className="inline-flex items-center bg-white/10 border border-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider mb-6 w-fit backdrop-blur-sm">
                Primary Workspace
              </div>
              <h3 className="text-4xl font-extrabold text-white mb-4">National Aggregate Dashboard</h3>
              <p className="text-blue-100 text-lg mb-8 max-w-xl font-light leading-relaxed">
                Access the high-level national overview. View total budget allocations across all 28 states, aggregate idle funds, AI risk predictions, and intelligent reallocation strategies.
              </p>
              
              <Link href="/dashboard/central/main" className="inline-flex items-center justify-center bg-[#FF9933] hover:bg-orange-500 text-white font-bold py-4 px-8 rounded-xl shadow-[0_0_20px_rgba(255,153,51,0.4)] hover:shadow-[0_0_25px_rgba(255,153,51,0.6)] transition-all transform hover:-translate-y-1 w-fit text-lg">
                <LayoutDashboard className="w-6 h-6 mr-3" />
                Enter Main Dashboard
              </Link>
            </div>

            {/* Right side visual abstract */}
            <div className="hidden md:flex md:w-1/3 relative items-center justify-center p-8 bg-black/10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_1px,transparent_1px)] [background-size:20px_20px] opacity-30"></div>
              
              <div className="relative z-10 grid grid-cols-2 gap-4 w-full transform group-hover:scale-105 transition-transform duration-700">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 shadow-lg flex flex-col items-center justify-center h-32">
                  <Activity className="w-8 h-8 text-[#FF9933] mb-2" />
                  <span className="text-white text-sm font-bold">Live Flow</span>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 shadow-lg flex flex-col items-center justify-center h-32 mt-8">
                  <LineChart className="w-8 h-8 text-green-400 mb-2" />
                  <span className="text-white text-sm font-bold">Analytics</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================= DEPARTMENT GRID ================= */}
        <div>
          <div className="flex justify-between items-end mb-6 px-2">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 flex items-center">
                <Building className="w-6 h-6 mr-3 text-[#000080]" />
                Department Deep Dive
              </h3>
              <p className="text-gray-500 mt-1 ml-9">Select a specific ministry to track individual scheme allocations.</p>
            </div>
            
            <Link href="/dashboard/central/departments" className="hidden sm:flex items-center text-[#000080] font-semibold hover:text-[#FF9933] transition-colors">
              View All 42 Departments <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Dept: Health */}
            <Link href="/dashboard/central/dept/health" className="group bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-red-500 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300"></div>
              <div className="w-14 h-14 bg-red-50 text-red-600 rounded-xl flex items-center justify-center mb-6 group-hover:bg-red-500 group-hover:text-white transition-colors duration-300">
                <HeartPulse className="w-7 h-7" />
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-1">Ministry of Health</h4>
              <p className="text-sm text-gray-500 mb-4 line-clamp-2">Monitor NHM, Ayushman Bharat, and state medical infrastructure grants.</p>
              <div className="text-red-600 font-semibold text-sm flex items-center mt-auto">
                Open Analytics <ArrowRight className="w-4 h-4 ml-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </div>
            </Link>

            {/* Dept: Education */}
            <Link href="/dashboard/central/dept/education" className="group bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-blue-500 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300"></div>
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-500 group-hover:text-white transition-colors duration-300">
                <BookOpen className="w-7 h-7" />
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-1">Ministry of Education</h4>
              <p className="text-sm text-gray-500 mb-4 line-clamp-2">Track Samagra Shiksha, PM POSHAN, and higher education allocations.</p>
              <div className="text-blue-600 font-semibold text-sm flex items-center mt-auto">
                Open Analytics <ArrowRight className="w-4 h-4 ml-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </div>
            </Link>

            {/* Dept: Infrastructure */}
            <Link href="/dashboard/central/dept/infrastructure" className="group bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-yellow-500 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300"></div>
              <div className="w-14 h-14 bg-yellow-50 text-yellow-600 rounded-xl flex items-center justify-center mb-6 group-hover:bg-yellow-500 group-hover:text-white transition-colors duration-300">
                <HardHat className="w-7 h-7" />
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-1">Infrastructure</h4>
              <p className="text-sm text-gray-500 mb-4 line-clamp-2">Analyze PMGSY, Smart Cities Mission, and national highway fund flows.</p>
              <div className="text-yellow-600 font-semibold text-sm flex items-center mt-auto">
                Open Analytics <ArrowRight className="w-4 h-4 ml-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </div>
            </Link>

            {/* Dept: Agriculture */}
            <Link href="/dashboard/central/dept/agriculture" className="group bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-green-500 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300"></div>
              <div className="w-14 h-14 bg-green-50 text-green-600 rounded-xl flex items-center justify-center mb-6 group-hover:bg-green-500 group-hover:text-white transition-colors duration-300">
                <Tractor className="w-7 h-7" />
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-1">Rural & Agriculture</h4>
              <p className="text-sm text-gray-500 mb-4 line-clamp-2">Monitor PM-KISAN distributions, MGNREGA wages, and rural development.</p>
              <div className="text-green-600 font-semibold text-sm flex items-center mt-auto">
                Open Analytics <ArrowRight className="w-4 h-4 ml-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
            
            {/* Mobile View All Button */}
            <Link href="/dashboard/central/departments" className="sm:hidden w-full flex items-center justify-center py-4 bg-white border border-gray-200 rounded-xl text-[#000080] font-bold shadow-sm">
              View All 42 Departments <ArrowRight className="w-4 h-4 ml-2" />
            </Link>

          </div>
        </div>

      </main>
    </div>
  );
}
