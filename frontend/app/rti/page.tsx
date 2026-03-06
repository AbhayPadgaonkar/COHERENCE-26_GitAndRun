"use client"
import React, { useState, useRef, useEffect } from 'react';
import { 
  Building2, 
  Map, 
  MapPin, 
  Activity, 
  Info,
  ArrowDown,
  ArrowRight,
  Send,
  User,
  Bot,
  TrendingUp,
  Home,
  Briefcase
} from 'lucide-react';
import Link from 'next/link';

export default function CitizenPortal() {
  // 1. State for the user's current input
  const [inputValue, setInputValue] = useState("");
  
  // 2. State for the chat history
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      sender: 'bot', 
      text: "Namaste! I am the LokNidhi Citizen Assistant. You can ask me about government schemes, fund utilization in your state or how to apply for benefits. How can I help you today?" 
    }
  ]);
  
  // 3. State to show a "typing..." indicator
  const [isTyping, setIsTyping] = useState(false);

  // Auto-scroll reference
  const chatEndRef = useRef(null);

  // Auto-scroll to bottom whenever messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // 4. Function to handle sending a message
  const handleSendMessage = (e) => {
    e?.preventDefault(); // Prevent form submission reload
    
    if (!inputValue.trim()) return;

    // Add User message
    const newUserMsg = { id: Date.now(), sender: 'user', text: inputValue };
    setMessages(prev => [...prev, newUserMsg]);
    setInputValue("");
    setIsTyping(true);

    // Simulate AI Processing Delay (1.5 seconds)
    setTimeout(() => {
      let botReply = "I am a prototype AI. For exact details, please visit the official ministry portal. However, based on public RTI records, funds are currently being utilized as planned.";
      
      const lowerInput = newUserMsg.text.toLowerCase();

      // Simple keyword-based AI logic for the prototype
      if (lowerInput.includes("lowest") || lowerInput.includes("state")) {
        botReply = "Based on current public records, Uttar Pradesh currently has the lowest utilization rate at 58% (Spent: ₹5,200 Cr / Allocated: ₹9,000 Cr).";
      } else if (lowerInput.includes("education")) {
        botReply = "The Ministry of Education has been allocated ₹5,000 Cr this fiscal year. Currently, ₹3,200 Cr (64%) has been spent, primarily on the Samagra Shiksha scheme.";
      } else if (lowerInput.includes("apply") || lowerInput.includes("housing")) {
        botReply = "To apply for the Rural Housing Scheme (PMAY-G), you need to contact your local Gram Panchayat or Block Development Office with your Aadhar and bank details. ₹2,000 Cr has already been utilized to build 1.2 Lakh houses this year!";
      } else if (lowerInput.includes("health")) {
        botReply = "Health & Family welfare is performing very well with an 88% utilization rate. ₹6,200 Cr has been spent out of the allocated ₹7,000 Cr to upgrade CHCs and PHCs.";
      }

      setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'bot', text: botReply }]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800 pb-10">
      
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

        {/* Main Grid: Data on Left, Chatbot on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN: Data Visualizations (Span 2) */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* 2. Simplified Fund Flow */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                <Activity className="w-5 h-5 mr-2 text-[#000080]" /> 
                How Public Money Reaches You
              </h3>
              
              <div className="flex flex-col md:flex-row items-center justify-between bg-gray-50 p-6 rounded-xl border border-gray-100">
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
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-green-600" /> 
                Real World Outcomes (Impact)
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex items-start">
                  <Home className="w-8 h-8 text-blue-500 mr-4 mt-1" />
                  <div>
                    <h4 className="font-bold text-gray-900">Rural Housing Scheme</h4>
                    <p className="text-xs text-gray-500 mb-2">Funds Spent: ₹2,000 Cr</p>
                    <p className="text-sm font-semibold text-blue-700 bg-blue-100 inline-block px-2 py-1 rounded">
                      1.2 Lakh Houses Built
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-start">
                  <Briefcase className="w-8 h-8 text-gray-700 mr-4 mt-1" />
                  <div>
                    <h4 className="font-bold text-gray-900">Road Infrastructure</h4>
                    <p className="text-xs text-gray-500 mb-2">Funds Spent: ₹3,500 Cr</p>
                    <p className="text-sm font-semibold text-gray-800 bg-gray-200 inline-block px-2 py-1 rounded">
                      600 km Roads Laid
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Fully Interactive AI Citizen Chatbot */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xl flex flex-col h-[600px] sticky top-24">
              
              {/* Chatbot Header */}
              <div className="bg-gradient-to-r from-[#000080] to-[#05054d] p-4 rounded-t-2xl flex items-center shadow-md z-10">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mr-3 shadow-md">
                  <Bot className="w-6 h-6 text-[#FF9933]" />
                </div>
                <div>
                  <h3 className="font-bold text-white">LokNidhi Assistant</h3>
                  <p className="text-xs text-blue-200 flex items-center">
                    <span className="w-2 h-2 rounded-full bg-green-400 mr-1 animate-pulse"></span> Online (Public Access)
                  </p>
                </div>
              </div>

              {/* Chat Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                
                {/* Dynamically render messages */}
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex items-start ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                    
                    {/* Bot Avatar */}
                    {msg.sender === 'bot' && (
                      <div className="w-8 h-8 bg-[#000080] rounded-full flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                    )}
                    
                    {/* Message Bubble */}
                    <div className={`p-3 text-sm shadow-sm max-w-[85%] ${
                      msg.sender === 'user' 
                        ? 'bg-[#000080] text-white rounded-2xl rounded-tr-none' 
                        : 'bg-white border border-gray-200 text-gray-700 rounded-2xl rounded-tl-none'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}

                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-[#000080] rounded-full flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-none p-3 text-sm text-gray-700 shadow-sm flex space-x-1 items-center h-10">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                )}
                
                {/* Invisible div to force scroll to bottom */}
                <div ref={chatEndRef} />
              </div>

              {/* Suggested Questions */}
              <div className="p-3 bg-white border-t border-gray-100 flex gap-2 overflow-x-auto whitespace-nowrap hide-scrollbar shadow-sm z-10">
                <button 
                  onClick={() => setInputValue("What is the budget for Education?")}
                  className="text-xs border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full transition-colors flex-shrink-0"
                >
                  Budget for Education?
                </button>
                <button 
                  onClick={() => setInputValue("Which state has the lowest utilization?")}
                  className="text-xs border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full transition-colors flex-shrink-0"
                >
                  Lowest state utilization?
                </button>
              </div>

              {/* Form Input Area */}
              <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-200 rounded-b-2xl">
                <div className="relative flex items-center">
                  <input 
                    type="text" 
                    placeholder="Ask about a scheme or process..." 
                    className="w-full text-sm border border-gray-300 rounded-full pl-4 pr-12 py-3 focus:outline-none focus:border-[#000080] focus:ring-1 focus:ring-[#000080] transition-all"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                  />
                  <button 
                    type="submit" 
                    disabled={!inputValue.trim() || isTyping}
                    className={`absolute right-2 p-2 rounded-full transition-colors ${
                      inputValue.trim() && !isTyping ? 'bg-[#FF9933] hover:bg-orange-500 text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[10px] text-center text-gray-400 mt-2">AI-generated based on public RTI data.</p>
              </form>

            </div>
          </div>

        </div>
      </main>
    </div>
  );
}