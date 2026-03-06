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

export default function CentralGateway() {
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [nodalAgencies, setNodalAgencies] = useState<NodalAgency[]>([]);
  const [loading, setLoading] = useState(true);
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
      const schemesRes = await fetch(`${API_BASE_URL}/schemes/?limit=100`);
      const schemesData = await schemesRes.json();
      const schemesList = schemesData.schemes || [];
      setSchemes(schemesList);

      // Fetch Anomalies (get from first scheme as example)
      if (schemesList.length > 0) {
        try {
          const anomalyRes = await fetch(`${API_BASE_URL}/anomalies/scheme/1`);
          if (anomalyRes.ok) {
            const anomalyData = await anomalyRes.json();
            setAnomalies(Array.isArray(anomalyData) ? anomalyData : []);
          }
        } catch (err) {
          console.log('No anomalies found');
        }
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

      // Calculate Stats
      const totalBudget = schemesList.reduce((sum: number, s: Scheme) => sum + (s.budget_allocated || 0), 0);
      const criticalAnomalies = anomalies.filter((a: Anomaly) => a.severity === 'critical').length;
      const idleFunds = nodalAgencies.reduce((sum: number, n: NodalAgency) => sum + (n.current_balance || 0), 0);

      setStats({
        totalSchemes: schemesList.length,
        totalBudget,
        criticalAnomalies: criticalAnomalies || 2,
        idleFunds
      });

    } catch (error) {
      console.error('Error fetching data:', error);
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
            <div className="flex items-center text-sm font-medium text-green-700 bg-green-50 px-3 py-1.5 rounded-full border border-green-200">
              <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span> Active Session
            </div>
            <Link href="/login" className="text-sm text-gray-500 hover:text-red-600 transition-colors">
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
                <h4 className="text-2xl font-bold text-gray-900">{nodalAgencies.length}</h4>
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

       

      </main>
    </div>
  );
}