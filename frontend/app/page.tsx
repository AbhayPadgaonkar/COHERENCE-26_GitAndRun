import React from 'react';
import { 
  Shield, 
  Database, 
  Brain, 
  MessageSquare, 
  LogIn,
  ArrowRight
} from 'lucide-react';

export default function LokNidhiLanding() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans selection:bg-[#FF9933] selection:text-white">
      
      {/* 1. Government Top Bar */}
      <div className="bg-gray-900 text-gray-200 text-xs py-1.5 px-4 md:px-10 flex justify-between items-center border-b-[3px] border-[#FF9933]">
        <div className="flex space-x-4 font-medium">
          <a href="#" className="hover:text-white transition-colors">Government of India</a>
          <span className="hidden md:inline text-gray-600">|</span>
          <a href="#" className="hidden md:inline hover:text-white transition-colors">Ministry of Finance</a>
        </div>
        <div className="flex space-x-4 items-center">
          <a href="#" className="hover:text-white transition-colors" title="Skip to main content">Skip to Main Content</a>
          <div className="flex space-x-2 border-l pl-4 border-gray-600">
            <button className="hover:text-white transition-colors">A-</button>
            <button className="hover:text-white font-bold transition-colors">A</button>
            <button className="hover:text-white transition-colors">A+</button>
          </div>
          <button className="border-l pl-4 border-gray-600 hover:text-white transition-colors font-medium">English</button>
        </div>
      </div>

      {/* 2. Modern Glassmorphism Header */}
      {/* 2. Modern Glassmorphism Header */}
      <header className="bg-white/90 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-100">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* National Emblem */}
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg" 
              alt="Satyameva Jayate" 
              className="h-12 sm:h-14 w-auto drop-shadow-sm"
            />
            
            {/* PFMS Logo Added to Navbar */}
            <img 
              src="/PFMS-2.png" 
              alt="PFMS Logo" 
              className="h-10 sm:h-12 w-auto drop-shadow-sm"
            />

            <div className="border-l-2 border-gray-200 pl-3 sm:pl-4">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#000080] tracking-tight">LokNidhi</h1>
              <p className="text-[9px] sm:text-xs text-gray-500 uppercase font-bold tracking-[0.1em] sm:tracking-[0.2em] mt-0.5">
                National Budget Flow Intelligence
              </p>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center space-x-8 font-semibold text-gray-600">
            <a href="#about" className="hover:text-[#FF9933] transition-colors">About Platform</a>
            <a href="#architecture" className="hover:text-[#FF9933] transition-colors">Architecture</a>
            <button className="flex items-center px-6 py-2.5 bg-[#000080] text-white rounded-lg hover:bg-blue-900 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5">
              Login Portal <LogIn className="ml-2 w-4 h-4" />
            </button>
          </nav>
        </div>
      </header>

      {/* 3. Enhanced Hero Section with Gradients & Animated Flow */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#000080] via-[#05054d] to-[#000022] text-white py-24 lg:py-32">
        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[#FF9933] blur-3xl mix-blend-screen"></div>
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-[#138808] blur-3xl mix-blend-screen"></div>
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10 flex flex-col lg:flex-row items-center gap-12">
          
          {/* Left Side Text Content */}
          <div className="lg:w-3/5">
            <div className="inline-flex items-center py-1.5 px-4 rounded-full bg-white/10 backdrop-blur-sm text-sm font-medium mb-6 border border-white/20 shadow-xl">
              <Shield className="mr-2 w-4 h-4 text-[#FF9933]" /> 
              <span className="text-gray-100">AI-Powered Proactive Leakage Detection</span>
            </div>
            
            <h2 className="text-5xl lg:text-6xl font-extrabold mb-6 leading-tight tracking-tight">
              Securing Public Funds with <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF9933] to-yellow-400">
                Data-Driven Governance
              </span>
            </h2>
            
            <p className="text-lg lg:text-xl text-gray-300 mb-10 max-w-2xl leading-relaxed font-light">
              LokNidhi intelligently tracks the flow of public funds across all administrative levels. We detect anomalies, forecast underutilization risks, and simulate optimal reallocation strategies for national growth.
            </p>
            
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <a href="/role-based" className="flex justify-center items-center px-8 py-3.5 bg-[#FF9933] text-white font-bold rounded-lg shadow-[0_0_20px_rgba(255,153,51,0.4)] hover:bg-orange-500 hover:shadow-[0_0_25px_rgba(255,153,51,0.6)] transition-all duration-300">
                Choose Role <ArrowRight className="ml-2 w-5 h-5" />
              </a>
              <button className="flex justify-center items-center px-8 py-3.5 bg-white/10 backdrop-blur-md border border-white/30 text-white font-bold rounded-lg hover:bg-white/20 transition-all duration-300">
                Read Documentation
              </button>
            </div>
          </div>
          
          {/* Right Side Animated Code-Based Visual (Replaces Image) */}
          <div className="lg:w-2/5 w-full mt-10 lg:mt-0 relative group [perspective:1000px]">
            {/* Glowing background blob */}
            <div className="absolute -inset-1 bg-gradient-to-r from-[#FF9933] to-[#138808] rounded-2xl blur-xl opacity-40 group-hover:opacity-70 transition duration-1000 animate-pulse"></div>

            {/* Glassmorphic Mockup Container */}
            <div className="relative h-[420px] w-full bg-[#00001a]/80 backdrop-blur-xl rounded-2xl border border-white/20 shadow-[0_0_40px_rgba(0,0,0,0.5)] p-6 flex flex-col justify-between overflow-hidden transform transition-transform duration-500 group-hover:scale-[1.02]">

              {/* Decorative Window Top Bar */}
              <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <div className="text-xs text-[#138808] font-mono flex items-center tracking-widest uppercase">
                  <span className="w-2 h-2 rounded-full bg-[#138808] mr-2 animate-pulse"></span>
                  Live Network
                </div>
              </div>

              {/* Animated Graph / Flow simulation */}
              <div className="flex-1 flex flex-col justify-center relative z-10 w-full">
                
                {/* Central Ministry Node */}
                <div className="w-full flex justify-center z-20">
                   <div className="px-5 py-3 bg-[#000080] border border-[#FF9933]/50 rounded-xl shadow-[0_0_20px_rgba(255,153,51,0.2)] text-sm text-white font-bold flex flex-col items-center justify-center">
                      <Database className="w-5 h-5 mb-1 text-[#FF9933]" /> 
                      Central Allocation
                   </div>
                </div>

                {/* Flowing Data Lines */}
                <div className="w-full h-16 flex justify-center space-x-20 relative opacity-70">
                   <div className="w-0.5 h-full bg-gradient-to-b from-[#FF9933] to-[#138808] relative">
                      <div className="absolute top-0 left-[-2px] w-1.5 h-4 bg-white rounded-full animate-[bounce_2s_infinite]"></div>
                   </div>
                   <div className="w-0.5 h-full bg-gradient-to-b from-[#FF9933] to-[#138808] relative">
                      <div className="absolute top-0 left-[-2px] w-1.5 h-4 bg-white rounded-full animate-[bounce_2.5s_infinite]"></div>
                   </div>
                   <div className="w-0.5 h-full bg-gradient-to-b from-[#FF9933] to-[#138808] relative">
                      <div className="absolute top-0 left-[-2px] w-1.5 h-4 bg-white rounded-full animate-[bounce_3s_infinite]"></div>
                   </div>
                </div>

                {/* State/District Nodes */}
                <div className="w-full flex justify-between px-2 z-20">
                  <div className="px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-xs text-gray-200 flex flex-col items-center">
                    <span className="mb-1 font-semibold">Node Alpha</span>
                    <span className="text-[#138808] font-mono font-bold">₹142 Cr</span>
                  </div>
                  <div className="px-4 py-2 bg-red-500/20 backdrop-blur-md border border-red-500/50 rounded-lg text-xs text-gray-200 flex flex-col items-center shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-pulse">
                    <span className="mb-1 font-semibold">Node Beta</span>
                    <span className="text-red-400 font-mono font-bold">₹89 Cr</span>
                  </div>
                  <div className="px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-xs text-gray-200 flex flex-col items-center">
                    <span className="mb-1 font-semibold">Node Gamma</span>
                    <span className="text-[#138808] font-mono font-bold">₹210 Cr</span>
                  </div>
                </div>
              </div>

              {/* AI Alert Mockup at bottom */}
              <div className="mt-8 p-3.5 bg-red-900/40 border border-red-500/50 rounded-xl flex items-start space-x-3 backdrop-blur-md transform transition-all hover:scale-105 cursor-pointer">
                <Shield className="w-5 h-5 text-red-400 mt-0.5 animate-pulse" />
                <div>
                  <div className="text-sm text-red-400 font-bold uppercase tracking-wide">Anomaly Intercepted</div>
                  <div className="text-xs text-gray-300 mt-1 leading-relaxed">Abnormal spending spike detected in <span className="text-white font-bold">Node Beta</span>. Fund leakage probability: <span className="text-red-400 font-bold">87%</span>.</div>
                </div>
              </div>
              
              {/* Subtle background grid pattern */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_1px,transparent_1px)] [background-size:16px_16px] opacity-20 pointer-events-none"></div>
            </div>
          </div>
          
        </div>
      </section>

      {/* 4. Beautiful Architecture Cards */}
      <section id="architecture" className="py-24 bg-white relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-[#000080] mb-4 tracking-tight">System Architecture</h2>
            <div className="w-24 h-1.5 bg-gradient-to-r from-[#FF9933] to-[#138808] mx-auto mb-6 rounded-full"></div>
            <p className="text-gray-500 max-w-2xl mx-auto text-lg">An end-to-end intelligence pipeline ensuring seamless data integration, automated monitoring, and actionable AI-driven reporting.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            
            {/* Step 1 & 2 */}
            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-[#FF9933]"></div>
              <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Database className="text-[#FF9933] w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-800">1. Data Registry</h3>
              <p className="text-gray-500 leading-relaxed">
                Cleanses and normalizes scheme budgets, allocations, and transactions across multiple departments to form the centralized Core Financial Layer.
              </p>
            </div>

            {/* Step 3 & 4 */}
            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-[#000080]"></div>
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Brain className="text-[#000080] w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-800">2. Intelligence Engine</h3>
              <p className="text-gray-500 leading-relaxed">
                The AI brain of LokNidhi. It monitors utilization rates, automatically detects anomalous spending spikes, and accurately predicts fund lapse risks.
              </p>
            </div>

            {/* Step 5 & 6 */}
            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-[#138808]"></div>
              <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <MessageSquare className="text-[#138808] w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-800">3. LLM Insights Layer</h3>
              <p className="text-gray-500 leading-relaxed">
                Converts complex financial anomalies into simple, human-readable alerts. Features a conversational AI assistant for instant policy answers.
              </p>
            </div>

          </div>
        </div>
      </section>
      {/* 5. Official Government Footer */}
      <footer className="bg-gray-900 text-gray-300 py-10 border-t-4 border-[#FF9933]">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 border-b border-gray-700 pb-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-4 mb-4">
                {/* Placeholder for your PFMS Logo */}
                <img 
                  src="/PFMS-2.png" 
                  alt="PFMS Logo" 
                  className="h-12 w-auto bg-white p-1 rounded"
                />
                <div className="border-l border-gray-600 pl-4">
                  <h3 className="text-white font-bold text-lg">LokNidhi</h3>
                  <p className="text-xs text-gray-400">National Budget Flow Intelligence</p>
                </div>
              </div>
              <p className="text-sm text-gray-400 max-w-md">
                A predictive financial intelligence platform designed to track public funds, detect inefficiencies, and ensure transparent governance.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-4 uppercase text-sm tracking-wider">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-[#FF9933] transition-colors">Ministry of Finance</a></li>
                <li><a href="#" className="hover:text-[#FF9933] transition-colors">Public Financial Management System</a></li>
                <li><a href="#" className="hover:text-[#FF9933] transition-colors">Data Analytics Division</a></li>
                <li><a href="#" className="hover:text-[#FF9933] transition-colors">Contact Support</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-4 uppercase text-sm tracking-wider">Policies</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Use</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Hyperlinking Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Copyright Policy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-6 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500">
            <p>© {new Date().getFullYear()} Government of India. All rights reserved.</p>
            <p className="mt-2 md:mt-0">Designed & Developed for proactive public financial governance.</p>
          </div>
        </div>
      </footer>

    </div>
  );
}