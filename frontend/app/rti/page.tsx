"use client"
import React from 'react';
import { 
  Building2, 
  Map, 
  MapPin, 
  Activity, 
  Info,
  ArrowDown,
  ArrowRight,
  User,
  TrendingUp,
  Home,
  Briefcase
} from 'lucide-react';
import Link from 'next/link';
// IMPORT YOUR NEW CHATBOT COMPONENT
import ChatBot from './Chatbot'; 

export default function CitizenPortal() {
  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800 pb-10 relative">
      
      {/* Official Public Top Bar */}
      <div className="bg-gray-900 text-gray-200 text-xs py-1.5 px-4 md:px-10 flex justify-between items-center border-b-[3px] border-[#FF9933]">
        <div className="flex space-x-4 font-medium">
          <span className="text-white">Government of India</span>
          <span className="hidden md:inline text-gray-600">|</span>
          <span className="hidden md:inline text-white">Public Information Portal (RTI)</span>
        </div>
      </div>

      {/* Glassmorphism Navbar */}
      <header className="bg-white/90 backdrop-blur-md shadow-sm sticky top-0 z-40 border-b border-gray-100">
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
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#000080] tracking-tight">LokNidhi</h1>
              <p className="text-[9px] sm:text-xs text-[#138808] uppercase font-bold tracking-[0.1em] sm:tracking-[0.2em] mt-0.5">
                Citizen Transparency Dashboard
              </p>
            </div>
          </div>
          <Link href="/login" className="px-4 py-2 bg-gray-100 text-[#000080] font-semibold rounded-lg hover:bg-gray-200 transition-colors text-sm border border-gray-200">
            Govt. Login
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">National Budget Transparency</h2>
          <p className="text-gray-500 mt-2 flex items-center">
            <Info className="w-4 h-4 mr-1.5 text-[#000080]" /> 
            Data provided under the Right to Information (RTI) framework. Updated monthly.
          </p>
        </div>

        {/* 1. National Financial Overview (KPIs) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Total National Budget</p>
            <h3 className="text-2xl font-black text-[#000080]">₹45 Lakh Cr</h3>
            <p className="text-xs text-gray-400 mt-2">FY 2024-2025</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Allocated to Schemes</p>
            <h3 className="text-2xl font-black text-[#FF9933]">₹30 Lakh Cr</h3>
            <p className="text-xs text-gray-400 mt-2">Across 312 active schemes</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-1 h-full bg-[#138808]"></div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Funds Utilized</p>
            <h3 className="text-2xl font-black text-[#138808]">₹21 Lakh Cr</h3>
            <p className="text-xs text-gray-400 mt-2">70% of allocated budget spent</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Citizens Benefited</p>
            <h3 className="text-2xl font-black text-blue-600">84.2 Crore</h3>
            <p className="text-xs text-gray-400 mt-2">Through Direct Benefit Transfers (DBT)</p>
          </div>
        </div>

        {/* Expanded Grid: Now taking full width since Chat is floating */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
          {/* 2. Simplified Fund Flow */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 h-full flex flex-col">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-[#000080]" /> 
              How Public Money Reaches You
            </h3>
            
            <div className="flex-1 flex flex-col md:flex-row items-center justify-between bg-gray-50 p-6 rounded-xl border border-gray-100">
              <div className="text-center mb-4 md:mb-0">
                <div className="w-12 h-12 mx-auto bg-[#000080] text-white rounded-full flex items-center justify-center mb-2 shadow-md">
                  <Building2 className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-gray-800">Central Govt</p>
                <p className="text-[10px] text-gray-500">₹45L Cr</p>
              </div>
              
              <ArrowRight className="hidden md:block w-5 h-5 text-gray-400" />
              <ArrowDown className="md:hidden w-5 h-5 text-gray-400 my-2" />

              <div className="text-center mb-4 md:mb-0">
                <div className="w-12 h-12 mx-auto bg-white border-2 border-[#FF9933] text-[#FF9933] rounded-full flex items-center justify-center mb-2 shadow-sm">
                  <Map className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-gray-800">State Govt</p>
                <p className="text-[10px] text-gray-500">₹30L Cr</p>
              </div>

              <ArrowRight className="hidden md:block w-5 h-5 text-gray-400" />
              <ArrowDown className="md:hidden w-5 h-5 text-gray-400 my-2" />

              <div className="text-center mb-4 md:mb-0">
                <div className="w-12 h-12 mx-auto bg-white border-2 border-[#138808] text-[#138808] rounded-full flex items-center justify-center mb-2 shadow-sm">
                  <MapPin className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-gray-800">Districts</p>
                <p className="text-[10px] text-gray-500">₹18L Cr</p>
              </div>

              <ArrowRight className="hidden md:block w-5 h-5 text-gray-400" />
              <ArrowDown className="md:hidden w-5 h-5 text-gray-400 my-2" />

              <div className="text-center">
                <div className="w-12 h-12 mx-auto bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-2 shadow-sm">
                  <User className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-gray-800">Citizens</p>
                <p className="text-[10px] text-blue-600 font-bold">Direct Benefits</p>
              </div>
            </div>
          </div>

          {/* 3. Scheme Outcome Impact */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 h-full flex flex-col">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-green-600" /> 
              Real World Outcomes (Impact)
            </h3>
            
            <div className="flex-1 grid grid-cols-1 gap-4">
              <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-6 flex items-start">
                <Home className="w-10 h-10 text-blue-500 mr-5 mt-1" />
                <div>
                  <h4 className="font-bold text-lg text-gray-900">Rural Housing Scheme</h4>
                  <p className="text-sm text-gray-500 mb-3">Funds Spent: ₹2,000 Cr</p>
                  <p className="text-sm font-semibold text-blue-700 bg-blue-100 inline-block px-3 py-1.5 rounded-md shadow-sm">
                    1.2 Lakh Houses Built
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 flex items-start">
                <Briefcase className="w-10 h-10 text-gray-700 mr-5 mt-1" />
                <div>
                  <h4 className="font-bold text-lg text-gray-900">Road Infrastructure</h4>
                  <p className="text-sm text-gray-500 mb-3">Funds Spent: ₹3,500 Cr</p>
                  <p className="text-sm font-semibold text-gray-800 bg-gray-200 inline-block px-3 py-1.5 rounded-md shadow-sm">
                    600 km Roads Laid
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Render the Floating Chatbot Component */}
      <ChatBot />

    </div>
  );
}