"use client"

import { useEffect, useState } from "react"
import { getFundFlowsByScheme, getTotalTransferred } from "@/lib/api"
import { ArrowRight, Clock, CheckCircle, XCircle, AlertCircle, TrendingUp, ArrowDown } from "lucide-react"

export default function StateFundFlowTracker({ schemes = [], stateName = "Maharashtra", refreshTrigger = 0 }) {
  const [fundFlows, setFundFlows] = useState([])
  const [totalTransferred, setTotalTransferred] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selectedScheme, setSelectedScheme] = useState(null)
  const [viewMode, setViewMode] = useState<"incoming" | "outgoing" | "all">("all")

  useEffect(() => {
    if (schemes.length > 0) {
      setSelectedScheme(schemes[0].scheme_code || schemes[0].id)
    }
  }, [schemes])

  useEffect(() => {
    if (selectedScheme) {
      console.log(`🔄 Loading fund flows for scheme: ${selectedScheme}, refresh: ${refreshTrigger}`)
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
      
      console.log(`📊 Loaded ${Array.isArray(flowsData) ? flowsData.length : 0} fund flows for scheme ${selectedScheme}`)
      console.log("Fund flows data:", flowsData)
      
      setFundFlows(Array.isArray(flowsData) ? flowsData : [])
      setTotalTransferred(totalData.total_transferred || 0)
    } catch (error) {
      console.error("❌ Error loading fund flows:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'credited':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'transferred':
        return <Clock className="w-5 h-5 text-blue-500" />
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return <AlertCircle className="w-5 h-5 text-yellow-500" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'credited':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'transferred':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'failed':
        return 'bg-red-100 text-red-700 border-red-200'
      default:
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Filter flows based on state perspective
  const filterFlows = () => {
    console.log(`🔍 Filtering ${fundFlows.length} flows for state: ${stateName}, mode: ${viewMode}`)
    
    if (viewMode === "incoming") {
      // Flows coming TO state (from Central)
      const incoming = fundFlows.filter(flow => {
        const toState = flow.to_level?.toLowerCase() === "state" && 
                       flow.to_entity_name?.toLowerCase().includes(stateName.toLowerCase())
        const fromCentral = flow.from_level?.toLowerCase() === "central"
        return toState || (fromCentral && flow.to_entity_name?.toLowerCase().includes(stateName.toLowerCase()))
      })
      console.log(`📥 Incoming flows (${incoming.length}):`, incoming)
      return incoming
    } else if (viewMode === "outgoing") {
      // Flows going FROM state (to Districts)
      const outgoing = fundFlows.filter(flow => {
        const fromState = flow.from_level?.toLowerCase() === "state" && 
                         flow.from_entity_name?.toLowerCase().includes(stateName.toLowerCase())
        const toDistrict = flow.to_level?.toLowerCase() === "district"
        const match = fromState || (toDistrict && flow.from_entity_name?.toLowerCase().includes(stateName.toLowerCase()))
        
        if (match) {
          console.log("✅ Outgoing flow match:", {
            from: flow.from_entity_name,
            to: flow.to_entity_name,
            amount: flow.amount,
            from_level: flow.from_level,
            to_level: flow.to_level
          })
        }
        
        return match
      })
      console.log(`📤 Outgoing flows (${outgoing.length}):`, outgoing)
      return outgoing
    }
    
    // For 'all' view, show flows where state is either sender or receiver
    const all = fundFlows.filter(flow => {
      const isReceiver = flow.to_level?.toLowerCase() === "state" && 
                        flow.to_entity_name?.toLowerCase().includes(stateName.toLowerCase())
      const isSender = flow.from_level?.toLowerCase() === "state" && 
                      flow.from_entity_name?.toLowerCase().includes(stateName.toLowerCase())
      const match = isReceiver || isSender
      
      console.log(`🔍 Flow ${flow.id || flow.fund_flow_reference}:`, {
        from_level: flow.from_level,
        from_entity: flow.from_entity_name,
        to_level: flow.to_level,
        to_entity: flow.to_entity_name,
        isSender,
        isReceiver,
        match: match ? "✅" : "❌"
      })
      
      return match
    })
    console.log(`📊 All flows filtered: ${all.length} of ${fundFlows.length}`)
    return all
  }

  const filteredFlows = filterFlows()
  
  // Calculate incoming flows (Central → State)
  const incomingFlows = fundFlows.filter(flow => {
    const toState = flow.to_level?.toLowerCase() === "state" && 
                   flow.to_entity_name?.toLowerCase().includes(stateName.toLowerCase())
    const fromCentral = flow.from_level?.toLowerCase() === "central"
    return toState || (fromCentral && flow.to_entity_name?.toLowerCase().includes(stateName.toLowerCase()))
  })
  
  // Calculate outgoing flows (State → District)
  const outgoingFlows = fundFlows.filter(flow => {
    const fromState = flow.from_level?.toLowerCase() === "state" && 
                     flow.from_entity_name?.toLowerCase().includes(stateName.toLowerCase())
    const toDistrict = flow.to_level?.toLowerCase() === "district"
    return fromState || (toDistrict && flow.from_entity_name?.toLowerCase().includes(stateName.toLowerCase()))
  })

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-[#138808] flex items-center">
            <TrendingUp className="w-6 h-6 mr-2 text-[#FF9933]" />
            State Fund Flow Tracker
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Monitor funds received from Central and distributed to Districts
          </p>
        </div>
        
        {schemes.length > 0 && (
          <select
            value={selectedScheme || ''}
            onChange={(e) => setSelectedScheme(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#138808]"
          >
            {schemes.map((scheme, index) => (
              <option 
                key={`${scheme.id || scheme.scheme_code}-${index}`} 
                value={scheme.scheme_code || scheme.id}
              >
                {scheme.name || scheme.scheme_name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-[#138808] to-[#0a5c04] rounded-xl p-4 text-white">
          <p className="text-sm opacity-90 mb-1">Total Funds Tracked</p>
          <h3 className="text-2xl font-bold">{formatCurrency(totalTransferred)}</h3>
          <p className="text-xs opacity-75 mt-2">{fundFlows.length} total transfers</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
          <p className="text-sm opacity-90 mb-1 flex items-center">
            <ArrowDown className="w-4 h-4 mr-1" />
            Received from Central
          </p>
          <h3 className="text-2xl font-bold">
            {formatCurrency(
              incomingFlows.reduce((sum, flow) => sum + (flow.amount || 0), 0)
            )}
          </h3>
          <p className="text-xs opacity-75 mt-2">{incomingFlows.length} incoming transfers</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white">
          <p className="text-sm opacity-90 mb-1 flex items-center">
            <ArrowRight className="w-4 h-4 mr-1" />
            Sent to Districts
          </p>
          <h3 className="text-2xl font-bold">
            {formatCurrency(
              outgoingFlows.reduce((sum, flow) => sum + (flow.amount || 0), 0)
            )}
          </h3>
          <p className="text-xs opacity-75 mt-2">{outgoingFlows.length} outgoing transfers</p>
        </div>
      </div>

      {/* View Mode Tabs */}
      <div className="flex space-x-2 mb-4 border-b border-gray-200">
        <button
          onClick={() => setViewMode("all")}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            viewMode === "all"
              ? "text-[#138808] border-b-2 border-[#138808]"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          All Transfers ({fundFlows.length})
        </button>
        <button
          onClick={() => setViewMode("incoming")}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            viewMode === "incoming"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Incoming ({incomingFlows.length})
        </button>
        <button
          onClick={() => setViewMode("outgoing")}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            viewMode === "outgoing"
              ? "text-purple-600 border-b-2 border-purple-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Outgoing ({outgoingFlows.length})
        </button>
      </div>

      {/* Fund Flow List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#138808]"></div>
        </div>
      ) : filteredFlows.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">No fund flows recorded yet</p>
          <p className="text-sm text-gray-500 mt-1">
            {viewMode === "all" && "No fund transfers to display"}
            {viewMode === "incoming" && "No incoming transfers from Central government"}
            {viewMode === "outgoing" && "No outgoing transfers to Districts"}
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredFlows.map((flow, index) => (
            <div 
              key={flow.id || index}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              {/* Flow Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(flow.status)}
                  <span className={`text-xs px-2 py-1 rounded-full border font-semibold ${getStatusColor(flow.status)}`}>
                    {flow.status.toUpperCase()}
                  </span>
                </div>
                <span className="text-xs text-gray-500">{flow.fund_flow_reference}</span>
              </div>

              {/* Flow Path */}
              <div className="flex items-center space-x-2 mb-3">
                <div className="flex-1 bg-blue-50 rounded-lg p-2 border border-blue-200">
                  <p className="text-xs text-gray-600">From</p>
                  <p className="font-semibold text-[#000080] text-sm">{flow.from_entity_name}</p>
                  <p className="text-xs text-gray-500">{flow.from_level}</p>
                </div>
                
                <ArrowRight className="w-5 h-5 text-[#FF9933] flex-shrink-0" />
                
                <div className="flex-1 bg-green-50 rounded-lg p-2 border border-green-200">
                  <p className="text-xs text-gray-600">To</p>
                  <p className="font-semibold text-[#138808] text-sm">{flow.to_entity_name}</p>
                  <p className="text-xs text-gray-500">{flow.to_level}</p>
                </div>
              </div>

              {/* Flow Details */}
              <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                <div>
                  <p className="text-2xl font-bold text-[#138808]">{formatCurrency(flow.amount)}</p>
                  <p className="text-xs text-gray-500">
                    {flow.payment_mode} • Sanction: {formatDate(flow.sanction_date)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-600">Installment</p>
                  <p className="text-sm font-semibold text-gray-800">
                    {flow.installment_number}/{flow.total_installments}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
