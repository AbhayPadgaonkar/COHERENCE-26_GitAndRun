"use client"

import { useEffect, useState } from "react"
import { getSchemes, createFundFlow, getDistrictAIInsights, getBeneficiaryPaymentsByDistrict, getDistrictAnomalies } from "@/lib/api"
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
  Users
} from "lucide-react"

// Component imports
import BlockMonitor from "@/app/components/district/BlockMonitor"
import DistrictFundFlowTracker from "@/app/components/district/DistrictFundFlowTracker"
import BeneficiaryPaymentChart from "@/app/components/district/BeneficiaryPaymentChart"
import DistrictAnomalyAlerts from "@/app/components/district/DistrictAnomalyAlerts"
import AIInsights from "@/components/AIInsights"

export default function DistrictDashboard() {
  const [schemes, setSchemes] = useState([])
  const [totalBudget, setTotalBudget] = useState(0)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [selectedDistrict, setSelectedDistrict] = useState("Mumbai")

  // --- Modal & Form State ---
  const [isFundTransferModalOpen, setIsFundTransferModalOpen] = useState(false)
  const [isFundTransferSubmitting, setIsFundTransferSubmitting] = useState(false)
  const [fundFlowRefreshKey, setFundFlowRefreshKey] = useState(0)
  
  // Fund transfer form (District → Beneficiary)
  const initialFundTransferState = {
    scheme_id: "",
    fund_flow_reference: "",
    from_level: "District",
    to_level: "Beneficiary",
    from_entity_code: "DIST-MH-MUM-001",
    to_entity_code: "BEN-001",
    from_entity_name: "Mumbai District Office",
    to_entity_name: "Beneficiary Name",
    amount: "",
    payment_mode: "Direct Benefit Transfer",
    sanction_date: new Date().toISOString().split('T')[0],
    transfer_date: new Date().toISOString().split('T')[0],
    status: "transferred",
    installment_number: 1,
    total_installments: 1,
    release_type: "DISTRICT_TO_BENEFICIARY"
  }
  const [fundTransferData, setFundTransferData] = useState(initialFundTransferState)

  // Stats
  const [stats, setStats] = useState({
    totalSchemes: 0,
    activeFunds: 0,
    blocksCount: 12,
    beneficiariesCount: 0
  })

  // AI Insights state
  const [aiInsights, setAiInsights] = useState({
    insights: "",
    confidence: "low",
    generated_at: new Date().toISOString()
  })
  const [isLoadingAI, setIsLoadingAI] = useState(false)

  // Load initial dashboard data
  const loadData = async () => {
    try {
      const schemeData = await getSchemes()
      const schemesList = schemeData?.schemes || []
      
      // Filter schemes relevant to the district
      const districtSchemes = schemesList.filter((s: any) => 
        s.implementing_states?.includes("Maharashtra") || !s.implementing_states
      )
      
      setSchemes(districtSchemes)

      const budget = districtSchemes.reduce((sum: number, s: any) => sum + (s.budget_allocated || 0), 0)
      setTotalBudget(budget)
      
      setStats({
        totalSchemes: districtSchemes.length,
        activeFunds: budget,
        blocksCount: 12,
        beneficiariesCount: 15000
      })

      // Load AI insights after data is fetched
      loadAIInsights(districtSchemes, budget)
    } catch (error) {
      console.error("Dashboard error:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [selectedDistrict])

  // --- Handle Fund Transfer Form Submission ---
  const handleFundTransferSubmit = async (e: any) => {
    e.preventDefault()
    setIsFundTransferSubmitting(true)
    
    try {
      const result = await createFundFlow(fundTransferData)
      
      if (result) {
        setIsFundTransferModalOpen(false)
        setFundTransferData(initialFundTransferState)
        await loadData()
        setFundFlowRefreshKey(prev => prev + 1)
        alert("✅ Payment to Beneficiary Recorded Successfully!")
      }
    } catch (error: any) {
      alert(`❌ Payment Failed:\n\n${error.message}`)
      console.error("Payment Error:", error)
    } finally {
      setIsFundTransferSubmitting(false)
    }
  }

  // --- Load AI Insights ---
  const loadAIInsights = async (districtSchemes?: any[], budget?: number) => {
    setIsLoadingAI(true)
    try {
      // Use existing data or fetch fresh
      const schemesToUse = districtSchemes || schemes
      const budgetToUse = budget || totalBudget

      // Fetch beneficiary payments and anomalies
      const payments = await getBeneficiaryPaymentsByDistrict(selectedDistrict)
      const anomalies = await getDistrictAnomalies(selectedDistrict)

      const aiData = await getDistrictAIInsights({
        district_name: selectedDistrict,
        schemes: schemesToUse,
        total_budget: budgetToUse,
        blocks_count: stats.blocksCount,
        beneficiary_payments: payments,
        anomalies: anomalies
      })

      setAiInsights({
        insights: aiData.insights || "No insights available",
        confidence: aiData.confidence || "low",
        generated_at: aiData.generated_at || new Date().toISOString()
      })
    } catch (error) {
      console.error("AI Insights error:", error)
      setAiInsights({
        insights: "Unable to generate AI insights at this time. Please try again later.",
        confidence: "low",
        generated_at: new Date().toISOString()
      })
    } finally {
      setIsLoadingAI(false)
    }
  }

  const formatCurrency = (amount: number) => {
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
          <div className="absolute inset-0 rounded-full border-t-4 border-[#000080] animate-spin"></div>
          <div className="absolute inset-2 rounded-full border-t-4 border-[#FF9933] animate-spin" style={{ animationDirection: 'reverse' }}></div>
        </div>
        <h2 className="text-xl font-bold text-[#000080] tracking-tight">Initializing District Dashboard</h2>
        <p className="text-sm text-gray-500 mt-2">Loading {selectedDistrict} operational data...</p>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      
      {/* Persistent Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 bg-gradient-to-br from-[#000080] to-[#000050] text-white flex-shrink-0 overflow-hidden`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <ShieldCheck className="w-6 h-6 text-[#FF9933]" />
                <h2 className="text-lg font-bold">LokNidhi</h2>
              </div>
              <p className="text-xs text-blue-200">District Portal</p>
            </div>
          </div>

          {/* Selected District */}
          <div className="mb-6 p-3 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
            <p className="text-xs text-blue-200 mb-1">Selected District</p>
            <p className="font-bold">{selectedDistrict}</p>
          </div>

          {/* Transfer to Beneficiary Button */}
          <div className="mb-6">
            <button
              onClick={() => setIsFundTransferModalOpen(true)}
              className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 text-white font-bold py-3 px-4 rounded-xl transition-all transform hover:-translate-y-0.5 flex items-center justify-between group"
            >
              <span className="flex items-center">
                <Send className="w-5 h-5 mr-3" />
                Pay Beneficiary
              </span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            <Link href="/district/main_dashboard" className="flex items-center space-x-3 px-4 py-3 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30 font-semibold hover:bg-white/30 transition-all">
              <LayoutDashboard className="w-5 h-5" />
              <span>Overview</span>
            </Link>
            <Link href="/district/blocks" className="flex items-center space-x-3 px-4 py-3 hover:bg-white/10 rounded-lg transition-all">
              <Building2 className="w-5 h-5" />
              <span>Blocks</span>
            </Link>
            <Link href="/district/beneficiaries" className="flex items-center space-x-3 px-4 py-3 hover:bg-white/10 rounded-lg transition-all">
              <Users className="w-5 h-5" />
              <span>Beneficiaries</span>
            </Link>
            <Link href="/district/fund-flow" className="flex items-center space-x-3 px-4 py-3 hover:bg-white/10 rounded-lg transition-all">
              <ArrowRightLeft className="w-5 h-5" />
              <span>Fund Flows</span>
            </Link>
            <Link href="/district/anomalies" className="flex items-center space-x-3 px-4 py-3 hover:bg-white/10 rounded-lg transition-all">
              <AlertTriangle className="w-5 h-5" />
              <span>Anomalies</span>
            </Link>
          </nav>

          <div className="mt-auto pt-8 border-t border-white/20">
            <Link href="/login" className="flex items-center space-x-3 px-4 py-3 hover:bg-white/10 rounded-lg transition-all text-blue-200">
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
                <h1 className="text-2xl font-extrabold text-[#000080]">District Command Center</h1>
                <p className="text-sm text-gray-500 flex items-center mt-0.5">
                  <MapPin className="w-3 h-3 mr-1" />
                  {selectedDistrict} • Beneficiary Payment Management
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
              <div className="flex items-center space-x-3 pl-4 border-l border-gray-200">
                <div className="w-8 h-8 rounded-full bg-[#000080] text-white flex items-center justify-center font-bold text-sm">
                  DA
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-semibold text-gray-900">District Admin</p>
                  <p className="text-xs text-gray-500">{selectedDistrict}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 to-blue-50/30 p-8">
          
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-orange-600" />
                </div>
                <TrendingUp className="w-5 h-5 text-orange-500" />
              </div>
              <h3 className="text-3xl font-extrabold text-gray-900">{stats.totalSchemes}</h3>
              <p className="text-sm text-gray-500 mt-1">Active Schemes</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Activity className="w-6 h-6 text-blue-600" />
                </div>
                <Activity className="w-5 h-5 text-blue-500" />
              </div>
              <h3 className="text-3xl font-extrabold text-gray-900">{formatCurrency(stats.activeFunds)}</h3>
              <p className="text-sm text-gray-500 mt-1">Active Funds</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-green-600" />
                </div>
                <Activity className="w-5 h-5 text-green-500" />
              </div>
              <h3 className="text-3xl font-extrabold text-gray-900">{stats.blocksCount}</h3>
              <p className="text-sm text-gray-500 mt-1">Blocks Count</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <TrendingUp className="w-5 h-5 text-purple-500" />
              </div>
              <h3 className="text-3xl font-extrabold text-gray-900">{stats.beneficiariesCount.toLocaleString()}</h3>
              <p className="text-sm text-gray-500 mt-1">Beneficiaries</p>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - 2/3 width */}
            <section className="lg:col-span-2 space-y-8">
              {/* Block Monitor */}
              <BlockMonitor districtName={selectedDistrict} />

              {/* Fund Flow Tracker */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Fund Flow Topology</h2>
                <DistrictFundFlowTracker 
                  schemes={schemes} 
                  districtName={selectedDistrict}
                  refreshTrigger={fundFlowRefreshKey} 
                />
              </div>

              {/* Beneficiary Payment Chart */}
              <BeneficiaryPaymentChart districtName={selectedDistrict} />
            </section>

            {/* Right Column - 1/3 width */}
            <section className="lg:col-span-1 space-y-8">
              {/* AI Insights */}
              <AIInsights
                insights={aiInsights.insights}
                confidence={aiInsights.confidence}
                generatedAt={aiInsights.generated_at}
                onRefresh={() => loadAIInsights()}
                isLoading={isLoadingAI}
                title="District AI Insights"
                accentColor="#000080"
              />

              {/* Anomaly Alerts */}
              <DistrictAnomalyAlerts districtName={selectedDistrict} />
            </section>
          </div>

        </main>
      </div>

      {/* Fund Transfer Modal (District → Beneficiary) */}
      {isFundTransferModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#000080] to-[#000050] p-6 text-white flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold flex items-center">
                  <Send className="w-6 h-6 mr-3" />
                  Pay Beneficiary
                </h2>
                <p className="text-sm text-blue-100 mt-1">Direct Benefit Transfer to eligible beneficiary</p>
              </div>
              <button 
                onClick={() => setIsFundTransferModalOpen(false)} 
                className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleFundTransferSubmit} className="p-6 space-y-4 overflow-y-auto">
              {/* Scheme Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Scheme *</label>
                <select
                  value={fundTransferData.scheme_id}
                  onChange={(e) => setFundTransferData({...fundTransferData, scheme_id: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#000080] transition-colors"
                  required
                >
                  <option value="">-- Select Scheme --</option>
                  {schemes.map((scheme: any, index) => (
                    <option key={`${scheme.id || scheme.scheme_code}-${index}`} value={scheme.id || scheme.scheme_code}>
                      {scheme.name || scheme.scheme_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Reference Number */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Reference Number *</label>
                <input
                  type="text"
                  value={fundTransferData.fund_flow_reference}
                  onChange={(e) => setFundTransferData({...fundTransferData, fund_flow_reference: e.target.value})}
                  placeholder="e.g., BEN-MUM-2024-001"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#000080] transition-colors"
                  required
                />
              </div>

              {/* Beneficiary Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Beneficiary Name *</label>
                  <input
                    type="text"
                    value={fundTransferData.to_entity_name}
                    onChange={(e) => setFundTransferData({...fundTransferData, to_entity_name: e.target.value})}
                    placeholder="Full Name"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#000080] transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Beneficiary ID *</label>
                  <input
                    type="text"
                    value={fundTransferData.to_entity_code}
                    onChange={(e) => setFundTransferData({...fundTransferData, to_entity_code: e.target.value})}
                    placeholder="e.g., BEN-001"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#000080] transition-colors"
                    required
                  />
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Amount (₹) *</label>
                <input
                  type="number"
                  value={fundTransferData.amount}
                  onChange={(e) => setFundTransferData({...fundTransferData, amount: e.target.value})}
                  placeholder="Enter amount in Rupees"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#000080] transition-colors"
                  required
                />
              </div>

              {/* Payment Mode */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Mode *</label>
                <select
                  value={fundTransferData.payment_mode}
                  onChange={(e) => setFundTransferData({...fundTransferData, payment_mode: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#000080] transition-colors"
                  required
                >
                  <option value="Direct Benefit Transfer">Direct Benefit Transfer (DBT)</option>
                  <option value="RTGS">RTGS</option>
                  <option value="NEFT">NEFT</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Sanction Date *</label>
                  <input
                    type="date"
                    value={fundTransferData.sanction_date}
                    onChange={(e) => setFundTransferData({...fundTransferData, sanction_date: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#000080] transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Transfer Date *</label>
                  <input
                    type="date"
                    value={fundTransferData.transfer_date}
                    onChange={(e) => setFundTransferData({...fundTransferData, transfer_date: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#000080] transition-colors"
                    required
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsFundTransferModalOpen(false)}
                  className="px-6 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isFundTransferSubmitting}
                  className="px-6 py-2.5 bg-gradient-to-r from-[#000080] to-[#000050] hover:from-[#000060] hover:to-[#000030] text-white font-semibold rounded-lg transition-all flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isFundTransferSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Process Payment
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
