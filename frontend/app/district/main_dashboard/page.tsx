"use client";

import React, { useEffect, useState } from 'react';
import { 
  LayoutDashboard, 
  Building, 
  Stethoscope, 
  GraduationCap, 
  HardHat, 
  Sprout,
  ArrowRight,
  Activity,
  Users,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  Loader2,
  MapPin
} from 'lucide-react';
import Link from 'next/link';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

interface Scheme {
  scheme_code: string;
  scheme_name: string;
  budget_allocated: number;
  scheme_type: string;
}

interface NodalAgency {
  id: number;
  agency_name: string;
  current_balance: number;
  last_transaction_date: string;
}

export default function DistrictGateway() {
  const [selectedDistrict, setSelectedDistrict] = useState('Pune'); // Default district
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [nodalAgency, setNodalAgency] = useState<NodalAgency | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSchemes: 0,
    districtBudget: 0,
    blockOffices: 12,
    dnaBalance: 0,
    lapseWarnings: 1
  });

  useEffect(() => {
    fetchDistrictData();
  }, [selectedDistrict]);

  const fetchDistrictData = async () => {
    try {
      setLoading(true);
      
      // Fetch All Schemes (filter by district on frontend or create district endpoint)
      const schemesRes = await fetch(`${API_BASE_URL}/schemes/?limit=50`);
      if (schemesRes.ok) {
        const schemesData = await schemesRes.json();
        const schemesList = schemesData.schemes || [];
        setSchemes(schemesList.slice(0, 10)); // Show subset for district

        const districtBudget = schemesList.slice(0, 10).reduce((sum: number, s: Scheme) => sum + (s.budget_allocated || 0), 0);
        
        setStats(prev => ({
          ...prev,
          totalSchemes: 10,
          districtBudget
        }));
      }

      // Fetch District Nodal Agency (DNA) data
      try {
        const dnaRes = await fetch(`${API_BASE_URL}/nodal-agencies/1`); // Example: DNA ID 1
        if (dnaRes.ok) {
          const dnaData = await dnaRes.json();
          setNodalAgency(dnaData);
          setStats(prev => ({ ...prev, dnaBalance: dnaData.current_balance || 0 }));
        }
      } catch (err) {
        console.log('No DNA data');
      }

    } catch (error) {
      console.error('Error fetching district data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCrores = (amount: number) => {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans selection:bg-[#000080] selection:text-white pb-20">
      
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
              <p className="text-[9px] sm:text-xs text-[#ea580c] uppercase font-bold tracking-[0.1em] sm:tracking-[0.2em] mt-0.5">
                District Authority Access
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
            <h2 className="text-3xl font-extrabold text-[#000080] tracking-tight">Welcome, District Magistrate</h2>
            <p className="text-gray-500 mt-1 flex items-center">
              <MapPin className="w-4 h-4 mr-1" />
              {selectedDistrict} District • Block-level execution and beneficiary transfers
            </p>
          </div>
          <div className="mt-4 md:mt-0 px-4 py-2 bg-red-50 text-red-800 rounded-lg border border-red-200 font-medium flex items-center shadow-sm">
            <AlertTriangle className="w-4 h-4 mr-2 text-red-600 animate-pulse" />
            {stats.lapseWarnings} Critical Fund Lapse Warning
          </div>
        </div>

        {/* Stats Overview */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#ea580c]" />
            <span className="ml-3 text-gray-600">Loading district data...</span>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
                    <Building className="w-6 h-6 text-orange-600" />
                  </div>
                  <TrendingUp className="w-5 h-5 text-orange-500" />
                </div>
                <h4 className="text-2xl font-bold text-gray-900">{stats.totalSchemes}</h4>
                <p className="text-sm text-gray-500 mt-1">District Schemes</p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-blue-600" />
                  </div>
                  <Activity className="w-5 h-5 text-blue-500" />
                </div>
                <h4 className="text-2xl font-bold text-gray-900">{formatCrores(stats.districtBudget)}</h4>
                <p className="text-sm text-gray-500 mt-1">District Budget</p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                  <Activity className="w-5 h-5 text-green-500" />
                </div>
                <h4 className="text-2xl font-bold text-gray-900">{stats.blockOffices}</h4>
                <p className="text-sm text-gray-500 mt-1">Block Offices</p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                    <Activity className="w-6 h-6 text-purple-600" />
                  </div>
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                </div>
                <h4 className="text-2xl font-bold text-gray-900">{stats.lapseWarnings}</h4>
                <p className="text-sm text-gray-500 mt-1">Lapse Warnings</p>
              </div>
            </div>

            {/* District Schemes */}
            {schemes.length > 0 && (
              <div className="mb-12 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900">{selectedDistrict} District Schemes</h3>
                  <Link href="/dashboard/district/schemes" className="text-[#ea580c] font-semibold text-sm hover:text-[#000080] transition-colors">
                    View All →
                  </Link>
                </div>
                <div className="space-y-3">
                  {schemes.slice(0, 5).map((scheme, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{scheme.scheme_name}</h4>
                        <p className="text-sm text-gray-500">{scheme.scheme_type}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-[#ea580c]">{formatCrores(scheme.budget_allocated)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* DNA Balance Card */}
            {nodalAgency && (
              <div className="mb-12 bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-6 shadow-sm border border-purple-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4">District Nodal Agency (DNA) Balance</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Agency Name</p>
                    <p className="font-bold text-gray-900">{nodalAgency.agency_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Current Balance</p>
                    <p className="font-bold text-purple-600 text-xl">{formatCrores(nodalAgency.current_balance)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Last Transaction</p>
                    <p className="font-semibold text-gray-700">{new Date(nodalAgency.last_transaction_date).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}


      </main>
    </div>
  );
}