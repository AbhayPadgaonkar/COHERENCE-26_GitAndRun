"use client"

import { useEffect, useState } from "react"
import { getSchemes, getAnomalies, createScheme, createFundFlow } from "@/lib/api"
import Link from "next/link"
import { 
  Loader2, 
  Activity, 
  Menu, 
  Bell, 
  Search,
  ShieldCheck,
  LayoutDashboard,
  Building2,
  AlertTriangle,
  Lightbulb,
  FileText,
  Settings,
  LogOut,
  ChevronRight,
  FilePlus,
  X,
  ArrowRightLeft,
  PieChart,
  BarChart3
} from "lucide-react"

// Component imports
import KPICards from "@/app/components/central/KPICards"
import SchemeGrid from "@/app/components/central/SchemeGrid"
import MinistryBudgetChart from "@/app/components/central/MinistryBudgetChart"
import SchemeTypePieChart from "@/app/components/central/SchemeTypePieChart"
import AnomalyAlerts from "@/app/components/central/AnomalyAlerts"
import FundFlowTracker from "@/app/components/central/FundFlowTracker"
import FundReallocation from "@/app/components/central/FundReallocation"

export default function CentralDashboard() {
  const [schemes, setSchemes] = useState([])
  const [anomalies, setAnomalies] = useState([])
  const [totalBudget, setTotalBudget] = useState(0)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // --- Modal & Form State ---
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isFundFlowModalOpen, setIsFundFlowModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isFundFlowSubmitting, setIsFundFlowSubmitting] = useState(false)
  const [fundFlowRefreshKey, setFundFlowRefreshKey] = useState(0)
  
  // Default form data with all required fields
  const initialFormState = {
    scheme_code: "",
    name: "",
    ministry: "Ministry of Finance",
    budget_allocated: "",
    fiscal_year: 2024,
    budget_financial_year: "2024-2025",
    scheme_type: "Infrastructure",
    target_beneficiaries: "",
    beneficiary_category: "General",
    launch_date: new Date().toISOString().split('T')[0],
    status: "Active",
    priority: "medium",
    coverage_states: ["Maharashtra", "Gujarat"],
    coverage_type: "Multi-State",
    description: ""
  }
  const [formData, setFormData] = useState(initialFormState)

  // Fund Flow Form State
  const initialFundFlowState = {
    scheme_id: "",
    fund_flow_reference: "",
    from_level: "National",
    to_level: "State",
    from_entity_code: "CENTRAL-001",
    to_entity_code: "STATE-MH-001",
    from_entity_name: "Central Government",
    to_entity_name: "Maharashtra State Government",
    amount: "",
    payment_mode: "RTGS",
    sanction_date: new Date().toISOString().split('T')[0],
    transfer_date: new Date().toISOString().split('T')[0],
    status: "transferred",
    installment_number: 1,
    total_installments: 1,
    release_type: "FIRST_INSTALLMENT"
  }
  const [fundFlowData, setFundFlowData] = useState(initialFundFlowState)

  // Load initial dashboard data
  const loadData = async () => {
    try {
      const schemeData = await getSchemes()
      const schemesList = schemeData?.schemes || []
      setSchemes(schemesList)

      const budget = schemesList.reduce((sum, s) => sum + (s.budget_allocated || 0), 0)
      setTotalBudget(budget)

      if (schemesList.length > 0) {
        const anomalyData = await getAnomalies(schemesList[0].id)
        setAnomalies(anomalyData || [])
      }
    } catch (error) {
      console.error("Dashboard error:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // --- Handle Scheme Creation Form Submission ---
  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const result = await createScheme(formData)
      if (result.success || result.scheme) {
        setIsModalOpen(false) 
        setFormData(initialFormState) 
        await loadData() 
        alert("✅ Scheme Generated and Dispatched Successfully!")
      }
    } catch (error) {
      alert(`❌ Validation Failed:\n\n${error.message}`)
      console.error("Form Submission Error:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // --- Handle Fund Flow Creation ---
  const handleFundFlowSubmit = async (e) => {
    e.preventDefault()
    setIsFundFlowSubmitting(true)
    
    try {
      const result = await createFundFlow(fundFlowData)
      if (result) {
        setIsFundFlowModalOpen(false)
        setFundFlowData(initialFundFlowState)
        await loadData() 
        setFundFlowRefreshKey(prev => prev + 1) 
        alert("✅ Fund Flow Transfer Recorded Successfully!")
      }
    } catch (error) {
      alert(`❌ Fund Flow Creation Failed:\n\n${error.message}`)
      console.error("Fund Flow Error:", error)
    } finally {
      setIsFundFlowSubmitting(false)
    }
  }

  // Common reusable input class for modals
  const inputClass = "w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:outline-none focus:border-[#000080] focus:ring-2 focus:ring-[#000080]/20 transition-all";

  if (loading) {
    return (
      <div className="flex h-screen bg-[#f8fafc] flex-col items-center justify-center">
        <div className="w-20 h-20 relative flex items-center justify-center mb-6">
          <div className="absolute inset-0 rounded-full border-t-4 border-[#000080] animate-spin opacity-80"></div>
          <div className="absolute inset-2 rounded-full border-t-4 border-[#FF9933] animate-spin" style={{ animationDirection: 'reverse' }}></div>
        </div>
        <h2 className="text-2xl font-extrabold text-[#000080] tracking-tight">Initializing Command Center</h2>
        <p className="text-gray-500 mt-2 font-medium">Synchronizing national financial data...</p>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-[#f8fafc] font-sans selection:bg-[#FF9933] selection:text-white overflow-hidden relative">
      
      {/* ================= SCHEME MODAL OVERLAY ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden transform transition-all border border-gray-100">
            <div className="bg-gradient-to-r from-[#000080] to-[#040466] px-8 py-6 flex justify-between items-center text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
              <div className="relative z-10">
                <h3 className="font-extrabold text-xl">Generate New Scheme</h3>
                <p className="text-sm text-blue-200 mt-1">Dispatch parameters to State Nodal Agencies</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="relative z-10 hover:bg-white/20 p-2 rounded-full transition-colors backdrop-blur-sm">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Scheme Code *</label>
                  <input type="text" required placeholder="e.g. PMDLM-2024-001" className={inputClass}
                    value={formData.scheme_code} onChange={(e) => setFormData({...formData, scheme_code: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Scheme Name *</label>
                  <input type="text" required placeholder="e.g. PM Digital Literacy" className={inputClass}
                    value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Ministry *</label>
                  <select className={inputClass} value={formData.ministry} onChange={(e) => setFormData({...formData, ministry: e.target.value})}>
                    <option value="Ministry of Finance">Ministry of Finance</option>
                    <option value="Ministry of Health and Family Welfare">Health & Family Welfare</option>
                    <option value="Ministry of Education">Ministry of Education</option>
                    <option value="Ministry of Agriculture and Farmers Welfare">Agriculture & Farmers</option>
                    <option value="Ministry of Rural Development">Rural Development</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Scheme Type *</label>
                  <select className={inputClass} value={formData.scheme_type} onChange={(e) => setFormData({...formData, scheme_type: e.target.value})}>
                    <option value="Infrastructure">Infrastructure</option>
                    <option value="Social Welfare">Social Welfare</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Education">Education</option>
                    <option value="Agriculture">Agriculture</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Total Budget (Cr) *</label>
                  <div className="relative">
                    <span className="absolute left-4 top-2.5 text-gray-400 font-bold">₹</span>
                    <input type="number" required min="1" placeholder="5000" className={`${inputClass} pl-8`}
                      value={formData.budget_allocated} onChange={(e) => setFormData({...formData, budget_allocated: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Target Beneficiaries *</label>
                  <input type="number" required min="1" placeholder="1000000" className={inputClass}
                    value={formData.target_beneficiaries} onChange={(e) => setFormData({...formData, target_beneficiaries: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Fiscal Year *</label>
                  <input type="number" required placeholder="2024" className={inputClass}
                    value={formData.fiscal_year} onChange={(e) => setFormData({...formData, fiscal_year: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Financial Year *</label>
                  <input type="text" required placeholder="2024-2025" className={inputClass}
                    value={formData.budget_financial_year} onChange={(e) => setFormData({...formData, budget_financial_year: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Launch Date *</label>
                  <input type="date" required className={inputClass}
                    value={formData.launch_date} onChange={(e) => setFormData({...formData, launch_date: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Status *</label>
                  <select className={inputClass} value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Paused">Paused</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Description / Objectives</label>
                <textarea rows="3" placeholder="Brief objective of the scheme..." className={inputClass}
                  value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})}
                ></textarea>
              </div>

              <div className="pt-6 flex justify-end space-x-4 border-t border-gray-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 bg-[#FF9933] hover:bg-orange-500 text-white font-bold rounded-xl shadow-md shadow-orange-500/20 transition-all flex items-center transform hover:-translate-y-0.5">
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <FilePlus className="w-5 h-5 mr-2" />}
                  {isSubmitting ? 'Dispatching...' : 'Generate & Dispatch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= FUND FLOW MODAL OVERLAY ================= */}
      {isFundFlowModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden transform transition-all border border-gray-100">
            <div className="bg-gradient-to-r from-[#138808] to-[#0d5c05] px-8 py-6 flex justify-between items-center text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
              <div className="relative z-10">
                <h3 className="font-extrabold text-xl">Execute Fund Transfer</h3>
                <p className="text-sm text-green-100 mt-1">Securely track allocation across administrative levels</p>
              </div>
              <button onClick={() => setIsFundFlowModalOpen(false)} className="relative z-10 hover:bg-white/20 p-2 rounded-full transition-colors backdrop-blur-sm">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFundFlowSubmit} className="p-8 space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Select Scheme *</label>
                  <select required className={inputClass} value={fundFlowData.scheme_id} onChange={(e) => setFundFlowData({...fundFlowData, scheme_id: e.target.value})}>
                    <option value="">-- Select Scheme --</option>
                    {schemes.map((scheme) => (
                      <option key={scheme.id || scheme.scheme_code} value={scheme.scheme_code || scheme.id}>
                        {scheme.name || scheme.scheme_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Reference Number *</label>
                  <input type="text" required placeholder="e.g. TRX-2024-001" className={inputClass}
                    value={fundFlowData.fund_flow_reference} onChange={(e) => setFundFlowData({...fundFlowData, fund_flow_reference: e.target.value})}
                  />
                </div>
              </div>

              <div className="bg-gray-50/50 rounded-2xl p-5 border border-gray-100">
                <h4 className="text-sm font-bold text-[#000080] mb-4 flex items-center">
                  <ArrowRightLeft className="w-4 h-4 mr-2" /> Transfer Pathway
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">From Level *</label>
                      <select className={inputClass} value={fundFlowData.from_level} onChange={(e) => setFundFlowData({...fundFlowData, from_level: e.target.value})}>
                        <option value="National">National</option>
                        <option value="State">State</option>
                        <option value="District">District</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">From Entity Name *</label>
                      <input type="text" required placeholder="e.g. Central Govt" className={inputClass}
                        value={fundFlowData.from_entity_name} onChange={(e) => setFundFlowData({...fundFlowData, from_entity_name: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">To Level *</label>
                      <select className={inputClass} value={fundFlowData.to_level} onChange={(e) => setFundFlowData({...fundFlowData, to_level: e.target.value})}>
                        <option value="State">State</option>
                        <option value="District">District</option>
                        <option value="Beneficiary">Beneficiary</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">To Entity Name *</label>
                      <input type="text" required placeholder="e.g. Maharashtra State" className={inputClass}
                        value={fundFlowData.to_entity_name} onChange={(e) => setFundFlowData({...fundFlowData, to_entity_name: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Transfer Amount (₹) *</label>
                <div className="relative">
                  <span className="absolute left-4 top-2.5 text-gray-400 font-bold">₹</span>
                  <input type="number" required min="1" placeholder="50000000" className={`${inputClass} pl-8 text-lg font-semibold text-green-700`}
                    value={fundFlowData.amount} onChange={(e) => setFundFlowData({...fundFlowData, amount: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Payment Mode</label>
                  <select className={inputClass} value={fundFlowData.payment_mode} onChange={(e) => setFundFlowData({...fundFlowData, payment_mode: e.target.value})}>
                    <option value="RTGS">RTGS</option>
                    <option value="NEFT">NEFT</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Status</label>
                  <select className={inputClass} value={fundFlowData.status} onChange={(e) => setFundFlowData({...fundFlowData, status: e.target.value})}>
                    <option value="transferred">Transferred</option>
                    <option value="credited">Credited</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Release Type</label>
                  <select className={inputClass} value={fundFlowData.release_type} onChange={(e) => setFundFlowData({...fundFlowData, release_type: e.target.value})}>
                    <option value="FIRST_INSTALLMENT">First Installment</option>
                    <option value="FINAL_INSTALLMENT">Final Installment</option>
                  </select>
                </div>
              </div>

              <div className="pt-6 flex justify-end space-x-4 border-t border-gray-100">
                <button type="button" onClick={() => setIsFundFlowModalOpen(false)} className="px-6 py-2.5 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isFundFlowSubmitting} className="px-6 py-2.5 bg-[#138808] hover:bg-green-700 text-white font-bold rounded-xl shadow-md shadow-green-700/20 transition-all flex items-center transform hover:-translate-y-0.5">
                  {isFundFlowSubmitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <ArrowRightLeft className="w-5 h-5 mr-2" />}
                  {isFundFlowSubmitting ? 'Processing...' : 'Execute Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= LEFT SIDEBAR ================= */}
      <aside className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 z-20 ${sidebarOpen ? 'w-64' : 'w-20'} hidden md:flex shadow-sm`}>
        
        {/* Sidebar Header (Branding) */}
        <div className="h-20 flex items-center justify-center border-b border-gray-100 px-4">
          <img src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg" alt="Emblem" className={`transition-all duration-300 ${sidebarOpen ? 'h-12 mr-3' : 'h-10'}`} />
          {sidebarOpen && (
            <div className="flex flex-col">
              <span className="text-xl font-black text-[#000080] tracking-tight leading-none">LokNidhi</span>
              <span className="text-[10px] text-[#FF9933] font-bold uppercase tracking-widest mt-1">Central Portal</span>
            </div>
          )}
        </div>

        {/* Sidebar Navigation */}
        <div className="flex-1 overflow-y-auto py-6 flex flex-col gap-2 px-4">
          
          <button onClick={() => setIsModalOpen(true)} className={`mb-2 flex items-center justify-center py-3 bg-gradient-to-r from-[#FF9933] to-orange-500 text-white rounded-xl shadow-md shadow-orange-500/20 hover:shadow-lg transition-all transform hover:-translate-y-0.5 group ${!sidebarOpen && 'px-0'}`}>
            <FilePlus className="w-5 h-5 group-hover:scale-110 transition-transform" />
            {sidebarOpen && <span className="ml-2 font-bold text-sm tracking-wide">New Scheme</span>}
          </button>

          <button onClick={() => setIsFundFlowModalOpen(true)} className={`mb-6 flex items-center justify-center py-3 bg-gradient-to-r from-[#000080] to-[#040466] text-white rounded-xl shadow-md shadow-blue-900/20 hover:shadow-lg transition-all transform hover:-translate-y-0.5 group ${!sidebarOpen && 'px-0'}`}>
            <ArrowRightLeft className="w-5 h-5 group-hover:scale-110 transition-transform" />
            {sidebarOpen && <span className="ml-2 font-bold text-sm tracking-wide">Fund Transfer</span>}
          </button>

          <p className={`text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1 ml-2 ${!sidebarOpen && 'hidden'}`}>Analytics</p>
          
          <Link href="/dashboard/central/main" className="flex items-center px-3 py-3 bg-blue-50/80 text-[#000080] rounded-xl border-l-4 border-[#FF9933] group">
            <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span className="ml-3 font-bold text-sm">Command Center</span>}
          </Link>

          <Link href="#" className="flex items-center px-3 py-3 text-gray-500 hover:bg-gray-50 hover:text-[#000080] rounded-xl border-l-4 border-transparent transition-all group">
            <Activity className="w-5 h-5 flex-shrink-0 group-hover:scale-110 transition-transform" />
            {sidebarOpen && <span className="ml-3 font-semibold text-sm">Flow Topologies</span>}
          </Link>

          <Link href="/dashboard/central/departments" className="flex items-center px-3 py-3 text-gray-500 hover:bg-gray-50 hover:text-[#000080] rounded-xl border-l-4 border-transparent transition-all group">
            <Building2 className="w-5 h-5 flex-shrink-0 group-hover:scale-110 transition-transform" />
            {sidebarOpen && <span className="ml-3 font-semibold text-sm">Ministries</span>}
          </Link>

          <p className={`text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1 mt-6 ml-2 ${!sidebarOpen && 'hidden'}`}>Intelligence</p>

          <Link href="#" className="flex items-center justify-between px-3 py-3 text-gray-500 hover:bg-red-50 hover:text-red-700 rounded-xl border-l-4 border-transparent transition-all group">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 group-hover:animate-bounce" />
              {sidebarOpen && <span className="ml-3 font-semibold text-sm">Risk Alerts</span>}
            </div>
            {sidebarOpen && anomalies.length > 0 && (
              <span className="bg-red-100 text-red-600 text-xs font-black px-2 py-0.5 rounded-full border border-red-200">{anomalies.length}</span>
            )}
          </Link>
        </div>
      </aside>

      {/* ================= MAIN CONTENT WRAPPER ================= */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* TOP NAVBAR */}
        <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-6 lg:px-10 z-10">
          <div className="flex items-center">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors hidden md:block mr-4">
              <Menu className="w-6 h-6" />
            </button>
            <div className="hidden sm:flex items-center text-xs font-bold text-green-700 bg-green-50 px-3 py-1.5 rounded-full border border-green-200">
              <span className="flex h-2 w-2 relative mr-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Live Sync Active
            </div>
          </div>
          <div className="flex items-center space-x-4 sm:space-x-6">
            <div className="hidden lg:flex bg-gray-50 rounded-full px-4 py-2.5 items-center border border-gray-200 focus-within:ring-2 focus-within:ring-[#000080]/20 transition-all">
              <Search className="w-4 h-4 text-gray-400 mr-2" />
              <input type="text" placeholder="Search schemes, districts..." className="bg-transparent border-none text-sm text-gray-700 placeholder-gray-400 focus:outline-none w-64 font-medium" />
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF9933] to-orange-600 flex items-center justify-center font-bold text-white shadow-md cursor-pointer border-2 border-white ring-2 ring-gray-100">
              CG
            </div>
          </div>
        </header>

        {/* SCROLLABLE DASHBOARD CONTENT */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-10 space-y-8 relative z-0">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-gray-200 pb-6">
            <div>
              <div className="flex items-center text-[#000080] mb-2">
                <ShieldCheck className="w-5 h-5 mr-2" />
                <span className="text-xs font-black uppercase tracking-widest text-gray-500">National Analytics Workspace</span>
              </div>
              <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Command Center</h1>
            </div>
            <div className="mt-4 md:mt-0 px-4 py-2 bg-white rounded-xl border border-gray-200 shadow-sm text-sm font-bold text-gray-600">
              FY 2024-2025
            </div>
          </div>

          <section>
            <KPICards schemes={schemes} totalBudget={totalBudget} anomalies={anomalies} />
          </section>

          {/* ================= ENHANCED CHARTS GRID ================= */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <section className="lg:col-span-2 space-y-8">
              
              {/* Premium Chart Wrappers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col overflow-hidden hover:shadow-md transition-all group">
                  <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
                    <h2 className="font-bold text-gray-800 text-sm uppercase tracking-wide flex items-center">
                      <BarChart3 className="w-4 h-4 mr-2 text-[#000080]" /> Ministry Allocation
                    </h2>
                  </div>
                  <div className="p-5 flex-1 bg-white">
                    {/* The imported chart renders here */}
                    <MinistryBudgetChart schemes={schemes} />
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col overflow-hidden hover:shadow-md transition-all group">
                  <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
                    <h2 className="font-bold text-gray-800 text-sm uppercase tracking-wide flex items-center">
                      <PieChart className="w-4 h-4 mr-2 text-[#FF9933]" /> Sector Distribution
                    </h2>
                  </div>
                  <div className="p-5 flex-1 bg-white">
                    {/* The imported chart renders here */}
                    <SchemeTypePieChart schemes={schemes} />
                  </div>
                </div>
                
              </div>

              {/* Premium Fund Flow Wrapper */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col overflow-hidden hover:shadow-md transition-all">
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50/50 to-white">
                  <div>
                    <h2 className="font-extrabold text-gray-900 text-lg flex items-center">
                      <Activity className="w-5 h-5 mr-2 text-[#000080]" /> Fund Flow Topology
                    </h2>
                    <p className="text-xs text-gray-500 mt-1 font-medium">Real-time pipeline monitoring</p>
                  </div>
                </div>
                <div className="p-2 sm:p-6 bg-white">
                  {/* The imported Fund Flow tracker renders here */}
                  <FundFlowTracker schemes={schemes} refreshTrigger={fundFlowRefreshKey} />
                </div>
              </div>

              {/* Fund Reallocation Component */}
              <FundReallocation schemes={schemes} />

            </section>
            
            <section className="lg:col-span-1">
              <AnomalyAlerts anomalies={anomalies} />
            </section>
          </div>

          {/* Premium Data Grid Wrapper */}
          <section className="pt-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between bg-gray-50">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Active Schemes Directory</h2>
                  <p className="text-sm text-gray-500 mt-1 font-medium">Detailed breakdown of centrally sponsored programs</p>
                </div>
                <button className="mt-4 sm:mt-0 text-sm font-bold text-[#000080] hover:text-[#FF9933] transition-colors px-4 py-2 bg-white rounded-lg border border-gray-200 shadow-sm">
                  Export Data
                </button>
              </div>
              <div className="p-6">
                <SchemeGrid schemes={schemes} />
              </div>
            </div>
          </section>

        </main>
      </div>
    </div>
  )
}