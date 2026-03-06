import React from 'react';
import { 
  Building2, 
  Map, 
  MapPin, 
  ShieldCheck, 
  ArrowRight,
  Lock
} from 'lucide-react';
import Link from 'next/link';

export default function RoleSelectionPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      
      {/* Simplified Header for Auth Page */}
      <header className="bg-white border-b border-gray-200 py-4 shadow-sm">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg" 
              alt="Satyameva Jayate" 
              className="h-10 sm:h-12 w-auto"
            />
            <img 
              src="/PFMS-2.png" 
              alt="PFMS Logo" 
              className="h-8 sm:h-10 w-auto"
            />
            <div className="border-l-2 border-gray-200 pl-3">
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#000080] tracking-tight">LokNidhi</h1>
            </div>
          </div>
          <div className="flex items-center text-sm font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-200">
            <Lock className="w-4 h-4 mr-2" /> Secure Portal
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="max-w-4xl w-full">
          
          {/* Header Text */}
          <div className="text-center mb-10">
            <ShieldCheck className="w-12 h-12 text-[#000080] mx-auto mb-4" />
            <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Select Your Access Level</h2>
            <p className="text-gray-500 max-w-lg mx-auto">
              Please choose your administrative tier to access the LokNidhi intelligence dashboard.
            </p>
          </div>

          {/* Role Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* 1. Central Government Card */}
            <Link href="/central" className="group bg-white p-8 rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl hover:border-[#FF9933] transition-all duration-300 flex flex-col items-center text-center relative overflow-hidden transform hover:-translate-y-1">
              <div className="absolute top-0 left-0 w-full h-1 bg-[#FF9933] transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
              <div className="w-16 h-16 bg-orange-50 text-[#FF9933] rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Building2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Central Government</h3>
              <p className="text-sm text-gray-500 mb-6 flex-1">
                National budget overview, cross-state allocation tracking, and high-level anomaly detection.
              </p>
              <div className="mt-auto w-full flex items-center justify-center text-[#FF9933] font-semibold text-sm group-hover:underline">
                Enter Portal <ArrowRight className="w-4 h-4 ml-2" />
              </div>
            </Link>

            {/* 2. State Government Card */}
            <Link href="/state" className="group bg-white p-8 rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl hover:border-[#000080] transition-all duration-300 flex flex-col items-center text-center relative overflow-hidden transform hover:-translate-y-1">
              <div className="absolute top-0 left-0 w-full h-1 bg-[#000080] transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
              <div className="w-16 h-16 bg-blue-50 text-[#000080] rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Map className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">State Government</h3>
              <p className="text-sm text-gray-500 mb-6 flex-1">
                State-level nodal agency monitoring, district fund distribution, and scheme utilization analytics.
              </p>
              <div className="mt-auto w-full flex items-center justify-center text-[#000080] font-semibold text-sm group-hover:underline">
                Enter Portal <ArrowRight className="w-4 h-4 ml-2" />
              </div>
            </Link>

            {/* 3. District Government Card */}
            <Link href="/district" className="group bg-white p-8 rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl hover:border-[#138808] transition-all duration-300 flex flex-col items-center text-center relative overflow-hidden transform hover:-translate-y-1">
              <div className="absolute top-0 left-0 w-full h-1 bg-[#138808] transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
              <div className="w-16 h-16 bg-green-50 text-[#138808] rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <MapPin className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">District Authority</h3>
              <p className="text-sm text-gray-500 mb-6 flex-1">
                Department spending logs, beneficiary payment tracking, and local lapse risk forecasting.
              </p>
              <div className="mt-auto w-full flex items-center justify-center text-[#138808] font-semibold text-sm group-hover:underline">
                Enter Portal <ArrowRight className="w-4 h-4 ml-2" />
              </div>
            </Link>

          </div>
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="text-center py-6 text-sm text-gray-400">
        © {new Date().getFullYear()} LokNidhi Platform. Government of India.
      </footer>
    </div>
  );
}