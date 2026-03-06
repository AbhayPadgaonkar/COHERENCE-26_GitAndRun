import React from 'react';
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
  AlertTriangle
} from 'lucide-react';
import Link from 'next/link';

export default function DistrictGateway() {
  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans selection:bg-[#000080] selection:text-white pb-20">
      
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

      {/* Main Content Area */}
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        
        {/* Sleek Welcome Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 pb-6 border-b border-gray-200">
          <div>
            <h2 className="text-3xl font-extrabold text-[#000080] tracking-tight">Welcome, District Magistrate</h2>
            <p className="text-gray-500 mt-1">Select your workspace to monitor block-level execution and beneficiary transfers.</p>
          </div>
          <div className="mt-4 md:mt-0 px-4 py-2 bg-red-50 text-red-800 rounded-lg border border-red-200 font-medium flex items-center shadow-sm">
            <AlertTriangle className="w-4 h-4 mr-2 text-red-600 animate-pulse" />
            1 Critical Fund Lapse Warning
          </div>
        </div>

        {/* ================= OPTION 1: FULL WIDTH AGGREGATE HERO ================= */}
        <div className="mb-12 relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-[#ea580c] to-[#FF9933] rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
          
          <div className="relative bg-gradient-to-br from-[#c2410c] via-[#ea580c] to-[#9a3412] rounded-3xl overflow-hidden shadow-xl flex flex-col md:flex-row">
            
            {/* Left side content */}
            <div className="p-8 md:p-12 md:w-2/3 relative z-10 flex flex-col justify-center">
              <div className="inline-flex items-center bg-white/10 border border-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider mb-6 w-fit backdrop-blur-sm">
                Primary Workspace
              </div>
              <h3 className="text-4xl font-extrabold text-white mb-4">District Aggregate Dashboard</h3>
              <p className="text-orange-100 text-lg mb-8 max-w-xl font-light leading-relaxed">
                Access your Zilla Parishad overview. Track incoming funds from the State Nodal Agency, monitor block-wise spending performance, and ensure Direct Benefit Transfers (DBT) reach citizens without leakage.
              </p>
              
              <Link href="/dashboard/district/main" className="inline-flex items-center justify-center bg-white text-[#c2410c] hover:bg-gray-100 font-bold py-4 px-8 rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_25px_rgba(255,255,255,0.4)] transition-all transform hover:-translate-y-1 w-fit text-lg">
                <LayoutDashboard className="w-6 h-6 mr-3" />
                Enter District Dashboard
              </Link>
            </div>

            {/* Right side visual abstract */}
            <div className="hidden md:flex md:w-1/3 relative items-center justify-center p-8 bg-black/10">
              {/* Decorative grid */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_1px,transparent_1px)] [background-size:20px_20px] opacity-30"></div>
              
              <div className="relative z-10 grid grid-cols-2 gap-4 w-full transform group-hover:scale-105 transition-transform duration-700">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 shadow-lg flex flex-col items-center justify-center h-32">
                  <Activity className="w-8 h-8 text-white mb-2" />
                  <span className="text-white text-sm font-bold">Block Metrics</span>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 shadow-lg flex flex-col items-center justify-center h-32 mt-8">
                  <Users className="w-8 h-8 text-yellow-300 mb-2" />
                  <span className="text-white text-sm font-bold">DBT Tracking</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================= OPTION 2: DEPARTMENT GRID ================= */}
        <div>
          <div className="flex justify-between items-end mb-6 px-2">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 flex items-center">
                <Building className="w-6 h-6 mr-3 text-[#ea580c]" />
                Local Office Deep Dive
              </h3>
              <p className="text-gray-500 mt-1 ml-9">Select a specific district office to audit vendor payments and local scheme execution.</p>
            </div>
            
            <Link href="/dashboard/district/departments" className="hidden sm:flex items-center text-[#ea580c] font-semibold hover:text-[#000080] transition-colors">
              View All District Offices <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Dept: Chief Medical Officer */}
            <Link href="/dashboard/district/dept/health" className="group bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-red-500 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300"></div>
              <div className="w-14 h-14 bg-red-50 text-red-600 rounded-xl flex items-center justify-center mb-6 group-hover:bg-red-500 group-hover:text-white transition-colors duration-300">
                <Stethoscope className="w-7 h-7" />
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-1">Chief Medical Office</h4>
              <p className="text-sm text-gray-500 mb-4 line-clamp-2">Audit district hospital procurements, CHC/PHC funding, and local health camp budgets.</p>
              <div className="text-red-600 font-semibold text-sm flex items-center mt-auto">
                Open Analytics <ArrowRight className="w-4 h-4 ml-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </div>
            </Link>

            {/* Dept: District Education Office */}
            <Link href="/dashboard/district/dept/education" className="group bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-blue-500 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300"></div>
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-500 group-hover:text-white transition-colors duration-300">
                <GraduationCap className="w-7 h-7" />
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-1">Dist. Education Office</h4>
              <p className="text-sm text-gray-500 mb-4 line-clamp-2">Track block-wise school grants, teacher salary disbursements, and mid-day meal vendor logs.</p>
              <div className="text-blue-600 font-semibold text-sm flex items-center mt-auto">
                Open Analytics <ArrowRight className="w-4 h-4 ml-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </div>
            </Link>

            {/* Dept: Rural Works / Infrastructure */}
            <Link href="/dashboard/district/dept/infrastructure" className="group bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-yellow-500 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300"></div>
              <div className="w-14 h-14 bg-yellow-50 text-yellow-600 rounded-xl flex items-center justify-center mb-6 group-hover:bg-yellow-500 group-hover:text-white transition-colors duration-300">
                <HardHat className="w-7 h-7" />
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-1">Rural Works Dept</h4>
              <p className="text-sm text-gray-500 mb-4 line-clamp-2">Monitor local PMGSY road contractor payments, water supply schemes, and village infrastructure.</p>
              <div className="text-yellow-600 font-semibold text-sm flex items-center mt-auto">
                Open Analytics <ArrowRight className="w-4 h-4 ml-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </div>
            </Link>

            {/* Dept: Block Development / Agriculture */}
            <Link href="/dashboard/district/dept/agriculture" className="group bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-green-500 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300"></div>
              <div className="w-14 h-14 bg-green-50 text-green-600 rounded-xl flex items-center justify-center mb-6 group-hover:bg-green-500 group-hover:text-white transition-colors duration-300">
                <Sprout className="w-7 h-7" />
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-1">Dist. Agriculture Office</h4>
              <p className="text-sm text-gray-500 mb-4 line-clamp-2">Audit PM-KISAN local beneficiary lists, seed subsidy distributions, and equipment grants.</p>
              <div className="text-green-600 font-semibold text-sm flex items-center mt-auto">
                Open Analytics <ArrowRight className="w-4 h-4 ml-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
            
            {/* Mobile View All Button */}
            <Link href="/dashboard/district/departments" className="sm:hidden w-full flex items-center justify-center py-4 bg-white border border-gray-200 rounded-xl text-[#ea580c] font-bold shadow-sm">
              View All District Offices <ArrowRight className="w-4 h-4 ml-2" />
            </Link>

          </div>
        </div>

      </main>
    </div>
  );
}