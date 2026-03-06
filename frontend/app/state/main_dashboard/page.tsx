"use client";

import React, { useEffect, useState } from 'react';
import { 
  LayoutDashboard, 
  Building, 
  HeartPulse, 
  BookOpen, 
  HardHat, 
  Trees,
  ArrowRight,
  Activity,
  LineChart,
  ShieldAlert,
  AlertCircle,
  TrendingUp,
  DollarSign,
  Loader2,
  MapPin
} from 'lucide-react';
import Link from 'next/link';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

interface Scheme {
  scheme_code: string;
  scheme_name: string;
  ministry: string;
  budget_allocated: number;
  scheme_type: string;
  implementing_states?: string[];
}

interface Anomaly {
  id: number;
  scheme_id: number;
  anomaly_type: string;
  severity: string;
  description: string;
}

interface NodalAgency {
  id: number;
  agency_name: string;
  agency_type: string;
  current_balance: number;
  last_transaction_date: string;
}

export default function StateGateway() {
  const [selectedState, setSelectedState] = useState('Maharashtra'); // Default state
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [nodalAgencies, setNodalAgencies] = useState<NodalAgency[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSchemes: 0,
    totalBudget: 0,
    districtAlerts: 5,
    snaBalance: 0
  });

  useEffect(() => {
    fetchStateData();
  }, [selectedState]);

  const fetchStateData = async () => {
    try {
      setLoading(true);
      
      // Fetch State-Specific Schemes
      const schemesRes = await fetch(`${API_BASE_URL}/schemes/state/${selectedState}`);
      if (schemesRes.ok) {
        const schemesData = await schemesRes.json();
        const schemesList = schemesData.schemes || [];
        setSchemes(schemesList);

        setStats(prev => ({
          ...prev,
          totalSchemes: schemesData.count || schemesList.length,
          totalBudget: schemesData.total_budget || 0
        }));
      }

      // Fetch State Nodal Agencies
      try {
        const snaRes = await fetch(`${API_BASE_URL}/nodal-agencies/idle-funds`);
        if (snaRes.ok) {
          const snaData = await snaRes.json();
          const stateAgencies = snaData.filter((a: NodalAgency) => a.agency_type === 'SNA');
          setNodalAgencies(stateAgencies);
          
          const totalSNABalance = stateAgencies.reduce((sum: number, a: NodalAgency) => sum + a.current_balance, 0);
          setStats(prev => ({ ...prev, snaBalance: totalSNABalance }));
        }
      } catch (err) {
        console.log('No SNA data available');
      }

    } catch (error) {
      console.error('Error fetching state data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCrores = (amount: number) => {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans selection:bg-[#FF9933] selection:text-white pb-20">
      
      {/* Navbar */}
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
              <p className="text-[9px] sm:text-xs text-[#138808] uppercase font-bold tracking-[0.1em] sm:tracking-[0.2em] mt-0.5">
                State Government Access
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

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 pb-6 border-b border-gray-200">
          <div>
            <h2 className="text-3xl font-extrabold text-[#000080] tracking-tight">Welcome, State Authority</h2>
            <p className="text-gray-500 mt-1 flex items-center">
              <MapPin className="w-4 h-4 mr-1" />
              {selectedState} • State-level budget utilization and district distributions
            </p>
          </div>
          <div className="mt-4 md:mt-0 px-4 py-2 bg-yellow-50 text-yellow-800 rounded-lg border border-yellow-200 font-medium flex items-center shadow-sm">
            <ShieldAlert className="w-4 h-4 mr-2 text-yellow-600" />
            {stats.districtAlerts} Districts Nearing Fund Lapse
          </div>
        </div>

        {/* Stats Overview */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#138808]" />
            <span className="ml-3 text-gray-600">Loading state data...</span>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                    <Building className="w-6 h-6 text-green-600" />
                  </div>
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
                <h4 className="text-2xl font-bold text-gray-900">{stats.totalSchemes}</h4>
                <p className="text-sm text-gray-500 mt-1">State Schemes</p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-blue-600" />
                  </div>
                  <Activity className="w-5 h-5 text-blue-500" />
                </div>
                <h4 className="text-2xl font-bold text-gray-900">{formatCrores(stats.totalBudget)}</h4>
                <p className="text-sm text-gray-500 mt-1">State Budget</p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-yellow-600" />
                  </div>
                  <ShieldAlert className="w-5 h-5 text-yellow-500" />
                </div>
                <h4 className="text-2xl font-bold text-gray-900">{stats.districtAlerts}</h4>
                <p className="text-sm text-gray-500 mt-1">District Alerts</p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                    <LineChart className="w-6 h-6 text-purple-600" />
                  </div>
                  <Activity className="w-5 h-5 text-purple-500" />
                </div>
                <h4 className="text-2xl font-bold text-gray-900">{nodalAgencies.length}</h4>
                <p className="text-sm text-gray-500 mt-1">SNA Accounts</p>
              </div>
            </div>

            {/* State Schemes List */}
            {schemes.length > 0 && (
              <div className="mb-12 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900">{selectedState} State Schemes</h3>
                  <Link href="/dashboard/state/schemes" className="text-[#138808] font-semibold text-sm hover:text-[#000080] transition-colors">
                    View All →
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
                        <p className="font-bold text-[#138808]">{formatCrores(scheme.budget_allocated)}</p>
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