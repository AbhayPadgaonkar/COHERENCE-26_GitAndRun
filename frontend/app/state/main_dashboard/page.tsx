"use client"

import { useEffect, useState } from "react"
import { getSchemes, createFundFlow } from "@/lib/api"
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
  FileText,
  Settings,
  LogOut,
  ChevronRight,
  X,
  ArrowRightLeft,
  PieChart,
  BarChart3,
  MapPin,
  Send,
  TrendingUp,
  Building
} from "lucide-react"

// Component imports
import DistrictMonitor from "@/app/components/state/DistrictMonitor"
import StateFundFlowTracker from "@/app/components/state/StateFundFlowTracker"
import DistrictPerformanceChart from "@/app/components/state/DistrictPerformanceChart"
import StateAnomalyAlerts from "@/app/components/state/StateAnomalyAlerts"

export default function StateDashboard() {
  const [schemes, setSchemes] = useState([])
  const [totalBudget, setTotalBudget] = useState(0)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [selectedState, setSelectedState] = useState("Maharashtra")

  // --- Modal & Form State ---
  const [isFundTransferModalOpen, setIsFundTransferModalOpen] = useState(false)
  const [isFundTransferSubmitting, setIsFundTransferSubmitting] = useState(false)
  const [fundFlowRefreshKey, setFundFlowRefreshKey] = useState(0)
  
  // Fund transfer form (State → District)
  const initialFundTransferState = {
    scheme_id: "",
    fund_flow_reference: "",
    from_level: "State",
    to_level: "District",
    from_entity_code: "STATE-MH-001",
    to_entity_code: "DIST-MH-MUM-001",
    from_entity_name: "Maharashtra State Government",
    to_entity_name: "Mumbai District Office",
    amount: "",
    payment_mode: "RTGS",
    sanction_date: new Date().toISOString().split('T')[0],
    transfer_date: new Date().toISOString().split('T')[0],
    status: "transferred",
    installment_number: 1,
    total_installments: 1,
    release_type: "STATE_TO_DISTRICT"
  }
  const [fundTransferData, setFundTransferData] = useState(initialFundTransferState)

  // Stats
  const [stats, setStats] = useState({
    totalSchemes: 0,
    activeFunds: 0,
    districtsCount: 5,
    utilizationRate: 0
  })

  // Load initial dashboard data
  const loadData = async () => {
    try {
      const schemeData = await getSchemes()
      const schemesList = schemeData?.schemes || []
      
      // Filter schemes relevant to the state
      const stateSchemes = schemesList.filter(s => 
        s.implementing_states?.includes(selectedState) || !s.implementing_states
      )
      
      setSchemes(stateSchemes)

      const budget = stateSchemes.reduce((sum, s) => sum + (s.budget_allocated || 0), 0)
      setTotalBudget(budget)
      
      setStats({
        totalSchemes: stateSchemes.length,
        activeFunds: budget,
        districtsCount: 5,
        utilizationRate: 72
      })
    } catch (error) {
      console.error("Dashboard error:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [selectedState])

  // --- Handle Fund Transfer Form Submission ---
  const handleFundTransferSubmit = async (e) => {
    e.preventDefault()
    setIsFundTransferSubmitting(true)
    
    try {
      const result = await createFundFlow(fundTransferData)
      
      if (result) {
        setIsFundTransferModalOpen(false)
        setFundTransferData(initialFundTransferState)
        await loadData()
        setFundFlowRefreshKey(prev => prev + 1)
        alert("✅ Fund Transfer to District Recorded Successfully!")
      }
    } catch (error) {
      alert(`❌ Fund Transfer Failed:\n\n${error.message}`)
      console.error("Fund Transfer Error:", error)
    } finally {
      setIsFundTransferSubmitting(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50 flex-col items-center justify-center">
        <div className="w-16 h-16 relative flex items-center justify-center mb-4">
          <div className="absolute inset-0 rounded-full border-t-4 border-[#138808] animate-spin"></div>
          <div className="absolute inset-2 rounded-full border-t-4 border-[#FF9933] animate-spin" style={{ animationDirection: 'reverse' }}></div>
        </div>
        <h2 className="text-xl font-bold text-[#138808] tracking-tight">Initializing State Dashboard</h2>
        <p className="text-sm text-gray-500 mt-2">Loading {selectedState} financial data...</p>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      
      {/* Persistent Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 bg-gradient-to-br from-[#138808] to-[#0a5c04] text-white flex-shrink-0 overflow-hidden`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight">LokNidhi</h2>
              <p className="text-[10px] text-green-200 uppercase tracking-[0.2em] font-bold">State Portal</p>
            </div>
          </div>

          {/* State Selector */}
          <div className="mb-6 bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
            <p className="text-xs text-green-200 mb-2 font-semibold">Selected State</p>
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4" />
              <span className="font-bold">{selectedState}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 mb-8">
            <button
              onClick={() => setIsFundTransferModalOpen(true)}
              className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 text-white font-bold py-3 px-4 rounded-xl transition-all transform hover:-translate-y-0.5 flex items-center justify-between group"
            >
              <span className="flex items-center">
                <Send className="w-5 h-5 mr-3" />
                Transfer to District
              </span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            <Link href="/state/main_dashboard" className="flex items-center space-x-3 px-4 py-3 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30 font-semibold hover:bg-white/30 transition-all">
              <LayoutDashboard className="w-5 h-5" />
              <span>Overview</span>
            </Link>
            <Link href="/state/districts" className="flex items-center space-x-3 px-4 py-3 hover:bg-white/10 rounded-lg transition-all">
              <Building2 className="w-5 h-5" />
              <span>Districts</span>
            </Link>
            <Link href="/state/schemes" className="flex items-center space-x-3 px-4 py-3 hover:bg-white/10 rounded-lg transition-all">
              <FileText className="w-5 h-5" />
              <span>State Schemes</span>
            </Link>
            <Link href="/state/fund-flow" className="flex items-center space-x-3 px-4 py-3 hover:bg-white/10 rounded-lg transition-all">
              <ArrowRightLeft className="w-5 h-5" />
              <span>Fund Flows</span>
            </Link>
            <Link href="/state/anomalies" className="flex items-center space-x-3 px-4 py-3 hover:bg-white/10 rounded-lg transition-all">
              <AlertTriangle className="w-5 h-5" />
              <span>Anomalies</span>
            </Link>
          </nav>

          <div className="mt-auto pt-8 border-t border-white/20">
            <Link href="/login" className="flex items-center space-x-3 px-4 py-3 hover:bg-white/10 rounded-lg transition-all text-green-200">
              <LogOut className="w-5 h-5" />
              <span>Switch Role</span>
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Top Navigation */}
        <header className="bg-white border-b border-gray-200 shadow-sm z-10">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Menu className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-extrabold text-[#138808]">State Command Center</h1>
                <p className="text-sm text-gray-500 flex items-center mt-0.5">
                  <MapPin className="w-3 h-3 mr-1" />
                  {selectedState} • District Fund Management
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="p-2 hover:bg-gray-100 rounded-lg relative">
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg">
                <Settings className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex items-center space-x-2 pl-4 border-l border-gray-200">
                <div className="w-8 h-8 bg-gradient-to-br from-[#138808] to-[#0a5c04] rounded-full flex items-center justify-center text-white font-bold text-sm">
                  SA
                </div>
                <span className="text-sm font-semibold text-gray-700">State Admin</span>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                  <Building className="w-6 h-6 text-green-600" />
                </div>
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <h4 className="text-3xl font-bold text-gray-900">{stats.totalSchemes}</h4>
              <p className="text-sm text-gray-500 mt-1">State Schemes</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Activity className="w-6 h-6 text-blue-600" />
                </div>
                <Activity className="w-5 h-5 text-blue-500" />
              </div>
              <h4 className="text-2xl font-bold text-gray-900">{formatCurrency(stats.activeFunds)}</h4>
              <p className="text-sm text-gray-500 mt-1">Active Funds</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-purple-600" />
                </div>
                <Building2 className="w-5 h-5 text-purple-500" />
              </div>
              <h4 className="text-3xl font-bold text-gray-900">{stats.districtsCount}</h4>
              <p className="text-sm text-gray-500 mt-1">Districts</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-amber-50 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-amber-600" />
                </div>
                <TrendingUp className="w-5 h-5 text-amber-500" />
              </div>
              <h4 className="text-3xl font-bold text-gray-900">{stats.utilizationRate}%</h4>
              <p className="text-sm text-gray-500 mt-1">Avg Utilization</p>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - 2/3 width */}
            <section className="lg:col-span-2 space-y-8">
              {/* District Monitor */}
              <DistrictMonitor stateName={selectedState} />

              {/* Fund Flow Tracker */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Fund Flow Topology</h2>
                <StateFundFlowTracker 
                  schemes={schemes} 
                  stateName={selectedState}
                  refreshTrigger={fundFlowRefreshKey} 
                />
              </div>

              {/* District Performance Chart */}
              <DistrictPerformanceChart stateName={selectedState} />
            </section>

            {/* Right Column - 1/3 width */}
            <section className="lg:col-span-1">
              <StateAnomalyAlerts stateName={selectedState} />
            </section>
          </div>

        </main>
      </div>

      {/* Fund Transfer Modal (State → District) */}
      {isFundTransferModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#138808] to-[#0a5c04] p-6 text-white flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold flex items-center">
                  <Send className="w-6 h-6 mr-3" />
                  Transfer Fund to District
                </h2>
                <p className="text-sm text-green-100 mt-1">Allocate funds from state to district level</p>
              </div>
              <button 
                onClick={() => setIsFundTransferModalOpen(false)} 
                className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleFundTransferSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                {/* Scheme Selection */}
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Select Scheme</label>
                  <select
                    value={fundTransferData.scheme_id}
                    onChange={(e) => setFundTransferData({...fundTransferData, scheme_id: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#138808] transition-colors"
                    required
                  >
                    <option value="">-- Select Scheme --</option>
                    {schemes.map((scheme, index) => (
                      <option key={`${scheme.id || scheme.scheme_code}-${index}`} value={scheme.id || scheme.scheme_code}>
                        {scheme.name || scheme.scheme_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Reference Number */}
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Fund Flow Reference</label>
                  <input
                    type="text"
                    value={fundTransferData.fund_flow_reference}
                    onChange={(e) => setFundTransferData({...fundTransferData, fund_flow_reference: e.target.value})}
                    placeholder="FT-MH-2026-001"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#138808]"
                    required
                  />
                </div>

                {/* From Entity */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">From Entity Code</label>
                  <input
                    type="text"
                    value={fundTransferData.from_entity_code}
                    onChange={(e) => setFundTransferData({...fundTransferData, from_entity_code: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#138808]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">From Entity Name</label>
                  <input
                    type="text"
                    value={fundTransferData.from_entity_name}
                    onChange={(e) => setFundTransferData({...fundTransferData, from_entity_name: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#138808]"
                    required
                  />
                </div>

                {/* To Entity */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">To District Code</label>
                  <input
                    type="text"
                    value={fundTransferData.to_entity_code}
                    onChange={(e) => setFundTransferData({...fundTransferData, to_entity_code: e.target.value})}
                    placeholder="DIST-MH-MUM-001"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#138808]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">To District Name</label>
                  <input
                    type="text"
                    value={fundTransferData.to_entity_name}
                    onChange={(e) => setFundTransferData({...fundTransferData, to_entity_name: e.target.value})}
                    placeholder="Mumbai District Office"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#138808]"
                    required
                  />
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Transfer Amount (₹)</label>
                  <input
                    type="number"
                    value={fundTransferData.amount}
                    onChange={(e) => setFundTransferData({...fundTransferData, amount: e.target.value})}
                    placeholder="50000000"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#138808]"
                    required
                  />
                </div>

                {/* Payment Mode */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Mode</label>
                  <select
                    value={fundTransferData.payment_mode}
                    onChange={(e) => setFundTransferData({...fundTransferData, payment_mode: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#138808]"
                    required
                  >
                    <option value="RTGS">RTGS</option>
                    <option value="NEFT">NEFT</option>
                    <option value="IMPS">IMPS</option>
                    <option value="UPI">UPI</option>
                    <option value="CHECK">Check</option>
                  </select>
                </div>

                {/* Dates */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Sanction Date</label>
                  <input
                    type="date"
                    value={fundTransferData.sanction_date}
                    onChange={(e) => setFundTransferData({...fundTransferData, sanction_date: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#138808]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Transfer Date</label>
                  <input
                    type="date"
                    value={fundTransferData.transfer_date}
                    onChange={(e) => setFundTransferData({...fundTransferData, transfer_date: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#138808]"
                    required
                  />
                </div>

                {/* Installment Info */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Installment Number</label>
                  <input
                    type="number"
                    value={fundTransferData.installment_number}
                    onChange={(e) => setFundTransferData({...fundTransferData, installment_number: parseInt(e.target.value)})}
                    min="1"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#138808]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Total Installments</label>
                  <input
                    type="number"
                    value={fundTransferData.total_installments}
                    onChange={(e) => setFundTransferData({...fundTransferData, total_installments: parseInt(e.target.value)})}
                    min="1"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#138808]"
                    required
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                  <select
                    value={fundTransferData.status}
                    onChange={(e) => setFundTransferData({...fundTransferData, status: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#138808]"
                    required
                  >
                    <option value="transferred">Transferred</option>
                    <option value="credited">Credited</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsFundTransferModalOpen(false)}
                  className="px-6 py-2.5 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isFundTransferSubmitting}
                  className="px-6 py-2.5 bg-gradient-to-r from-[#138808] to-[#0a5c04] text-white rounded-lg font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isFundTransferSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Transfer Funds
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}