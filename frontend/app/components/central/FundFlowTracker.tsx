"use client"

import { useEffect, useState } from "react"
import { getFundFlowsByScheme, getTotalTransferred } from "@/lib/api"
import { 
  ArrowRight, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Landmark,
  Building2,
  MapPin,
  ArrowDown,
  Filter
} from "lucide-react"

export default function FundFlowTracker({ schemes = [], refreshTrigger = 0 }) {
  const [fundFlows, setFundFlows] = useState([])
  const [totalTransferred, setTotalTransferred] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selectedScheme, setSelectedScheme] = useState(null)

  useEffect(() => {
    if (schemes.length > 0 && !selectedScheme) {
      setSelectedScheme(schemes[0].scheme_code || schemes[0].id)
    }
  }, [schemes, selectedScheme])

  useEffect(() => {
    if (selectedScheme) {
      loadFundFlows()
    }
  }, [selectedScheme, refreshTrigger])

  const loadFundFlows = async () => {
    try {
      setLoading(true)
      const [flowsData, totalData] = await Promise.all([
        getFundFlowsByScheme(selectedScheme),
        getTotalTransferred(selectedScheme)
      ])
      
      setFundFlows(Array.isArray(flowsData) ? flowsData : [])
      setTotalTransferred(totalData.total_transferred || 0)
    } catch (error) {
      console.error("Error loading fund flows:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'credited':
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-[#138808]" />
      case 'transferred':
      case 'pending':
        return <Clock className="w-5 h-5 text-blue-500" />
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return <AlertCircle className="w-5 h-5 text-[#FF9933]" />
    }
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'credited':
      case 'completed':
        return 'bg-green-50 text-[#138808] border-green-200'
      case 'transferred':
      case 'pending':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'failed':
        return 'bg-red-50 text-red-700 border-red-200'
      default:
        return 'bg-orange-50 text-[#FF9933] border-orange-200'
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0)
  }

  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="w-full">
      
      {/* 1. Top Controls & Total Summary */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        
        {/* Scheme Selector */}
        {schemes.length > 0 ? (
          <div className="relative w-full md:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="h-4 w-4 text-gray-400" />
            </div>
            <select
              value={selectedScheme || ''}
              onChange={(e) => setSelectedScheme(e.target.value)}
              className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-800 py-2.5 pl-10 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#000080]/20 focus:border-[#000080] font-semibold text-sm transition-all shadow-sm"
            >
              {schemes.map((scheme, index) => (
                <option key={`${scheme.id || scheme.scheme_code}-${index}`} value={scheme.scheme_code || scheme.id}>
                  {scheme.name || scheme.scheme_name}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
              <ArrowDown className="w-4 h-4" />
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-500 italic">No schemes available</div>
        )}

        {/* Total Metric Pill */}
        <div className="bg-gradient-to-r from-[#000080] to-[#040466] rounded-xl px-6 py-2.5 shadow-md flex items-center justify-between w-full md:w-auto">
          <span className="text-blue-200 text-xs font-bold uppercase tracking-wider mr-4">Total Disbursed</span>
          <span className="text-white text-xl font-black">{formatCurrency(totalTransferred)}</span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 relative flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-t-2 border-[#000080] animate-spin"></div>
            <div className="absolute inset-1 rounded-full border-t-2 border-[#FF9933] animate-spin" style={{ animationDirection: 'reverse' }}></div>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* 2. Visual Topology Flow Diagram */}
          <div className="bg-gray-50/50 rounded-2xl border border-gray-100 p-6 flex flex-col justify-center relative overflow-hidden">
            <div className="flex items-center justify-between w-full px-2 sm:px-10 relative z-10">
              
              {/* Central Node */}
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 bg-white border-4 border-[#000080] text-[#000080] rounded-full flex items-center justify-center shadow-md mb-3 relative group">
                  <Landmark className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                </div>
                <span className="text-xs font-black text-gray-800 uppercase tracking-wider">Central</span>
              </div>

              {/* Animated Connecting Line 1 */}
              <div className="flex-1 flex items-center px-4">
                <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden relative">
                  <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#000080] to-[#FF9933] w-full animate-[shimmer_2s_infinite]"></div>
                </div>
              </div>

              {/* State Node */}
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 bg-white border-4 border-[#FF9933] text-[#FF9933] rounded-full flex items-center justify-center shadow-md mb-3 relative group">
                  <Building2 className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                </div>
                <span className="text-xs font-black text-gray-800 uppercase tracking-wider">State SNA</span>
              </div>

              {/* Animated Connecting Line 2 */}
              <div className="flex-1 flex items-center px-4">
                <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden relative">
                  <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#FF9933] to-[#138808] w-full animate-[shimmer_2s_infinite] delay-700"></div>
                </div>
              </div>

              {/* District Node */}
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 bg-white border-4 border-[#138808] text-[#138808] rounded-full flex items-center justify-center shadow-md mb-3 relative group">
                  <MapPin className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gray-300 border-2 border-white rounded-full"></div>
                </div>
                <span className="text-xs font-black text-gray-800 uppercase tracking-wider">District</span>
              </div>

            </div>
            
            {/* Custom Animation definition for the flow lines */}
            <style jsx>{`
              @keyframes shimmer {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
              }
            `}</style>
          </div>

          {/* 3. Chronological Transaction Timeline */}
          <div>
            <h3 className="text-sm font-extrabold text-gray-400 uppercase tracking-widest mb-6 ml-2">Transaction History</h3>

            {fundFlows.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200 shadow-sm">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-900 font-bold text-lg">No transfers recorded</p>
                <p className="text-sm text-gray-500 mt-1">Execute a fund transfer to see it appear in the timeline.</p>
              </div>
            ) : (
              <div className="relative border-l-2 border-gray-100 ml-4 sm:ml-8 space-y-6 pb-4">
                {fundFlows.map((flow, index) => (
                  <div key={flow.id || index} className="relative pl-6 sm:pl-10 group">
                    
                    {/* Timeline Node Dot */}
                    <div className="absolute -left-[11px] top-5 w-5 h-5 rounded-full bg-white border-[5px] border-[#000080] shadow-sm group-hover:scale-125 transition-transform duration-300"></div>
                    
                    {/* Transaction Card */}
                    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-lg hover:border-gray-200 transition-all duration-300">
                      
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-3 border-b border-gray-50 pb-4">
                        <div className="flex items-center space-x-3">
                          <span className={`text-[10px] px-3 py-1.5 rounded-md border font-black tracking-widest uppercase ${getStatusColor(flow.status)}`}>
                            {flow.status?.toUpperCase() || 'UNKNOWN'}
                          </span>
                          <span className="text-xs font-mono font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded">
                            {flow.fund_flow_reference || 'REF-PENDING'}
                          </span>
                        </div>
                        <div className="flex items-center text-sm font-bold text-gray-400">
                          <Clock className="w-4 h-4 mr-1.5" />
                          {formatDate(flow.transfer_date || flow.sanction_date)}
                        </div>
                      </div>

                      {/* Visual Flow Logic Box */}
                      <div className="flex items-center space-x-2 bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 border border-gray-100 mb-4">
                        <div className="flex-1">
                          <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1">Sender</p>
                          <p className="font-bold text-gray-900 text-sm truncate">{flow.from_entity_name || 'Central Ministry'}</p>
                          <p className="text-xs font-semibold text-[#000080]">{flow.from_level || 'Central'}</p>
                        </div>
                        
                        <div className="flex flex-col items-center justify-center px-4">
                          <p className="text-sm font-black text-[#138808] whitespace-nowrap mb-1">
                            {formatCurrency(flow.amount)}
                          </p>
                          <div className="w-full flex items-center">
                             <div className="h-[2px] flex-1 bg-gray-200"></div>
                             <ArrowRight className="w-4 h-4 text-gray-400 mx-1" />
                             <div className="h-[2px] flex-1 bg-gray-200"></div>
                          </div>
                        </div>
                        
                        <div className="flex-1 text-right">
                          <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1">Receiver</p>
                          <p className="font-bold text-gray-900 text-sm truncate">{flow.to_entity_name || 'State Agency'}</p>
                          <p className="text-xs font-semibold text-[#FF9933]">{flow.to_level || 'State'}</p>
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center font-semibold text-gray-500">
                          <span className="w-2 h-2 rounded-full bg-gray-300 mr-2"></span>
                          Via {flow.payment_mode || 'PFMS Transfer'}
                        </div>
                        <div className="font-bold text-[#000080]">
                          Installment {flow.installment_number || 1} of {flow.total_installments || 1}
                        </div>
                      </div>

                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  )
}