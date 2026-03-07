"use client"

import { useState, useEffect } from "react"
import { ArrowRightLeft, TrendingDown, TrendingUp, AlertTriangle, CheckCircle, X, Send } from "lucide-react"

interface UnderutilizedScheme {
  id: string
  name: string
  allocated: number
  utilized: number
  utilization_rate: number
  available: number
  department: string
  deadline_days: number
}

interface HighDemandScheme {
  id: string
  name: string
  department: string
  current_allocation: number
  demand: number
  shortage: number
}

export default function FundReallocation({ schemes = [] }) {
  const [underutilizedSchemes, setUnderutilizedSchemes] = useState<UnderutilizedScheme[]>([])
  const [highDemandSchemes, setHighDemandSchemes] = useState<HighDemandScheme[]>([])
  const [selectedSource, setSelectedSource] = useState<string>("")
  const [selectedTarget, setSelectedTarget] = useState<string>("")
  const [reallocationAmount, setReallocationAmount] = useState<string>("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    loadReallocationData()
  }, [schemes])

  const loadReallocationData = () => {
    // Generate dummy underutilized schemes (utilization < 50%)
    const underutilized: UnderutilizedScheme[] = [
      {
        id: "RURAL-INFRA-001",
        name: "Rural Infrastructure Development",
        allocated: 500000000,
        utilized: 150000000,
        utilization_rate: 30,
        available: 350000000,
        department: "Rural Development",
        deadline_days: 45
      },
      {
        id: "SKILL-DEV-002",
        name: "Skill Development Programme",
        allocated: 300000000,
        utilized: 105000000,
        utilization_rate: 35,
        available: 195000000,
        department: "Education",
        deadline_days: 60
      },
      {
        id: "AGRO-SUBSIDY-003",
        name: "Agricultural Subsidy Scheme",
        allocated: 800000000,
        utilized: 320000000,
        utilization_rate: 40,
        available: 480000000,
        department: "Agriculture",
        deadline_days: 30
      },
      {
        id: "HOUSING-URB-004",
        name: "Urban Housing Scheme",
        allocated: 600000000,
        utilized: 240000000,
        utilization_rate: 40,
        available: 360000000,
        department: "Housing & Urban Affairs",
        deadline_days: 90
      },
      {
        id: "TOURISM-PROM-005",
        name: "Tourism Promotion Scheme",
        allocated: 200000000,
        utilized: 60000000,
        utilization_rate: 30,
        available: 140000000,
        department: "Tourism",
        deadline_days: 75
      }
    ]

    // Generate dummy high-demand schemes
    const highDemand: HighDemandScheme[] = [
      {
        id: "HEALTH-EMG-001",
        name: "Emergency Healthcare Infrastructure",
        department: "Health & Family Welfare",
        current_allocation: 400000000,
        demand: 800000000,
        shortage: 400000000
      },
      {
        id: "DIGITAL-EDU-002",
        name: "Digital Education Initiative",
        department: "Education",
        current_allocation: 250000000,
        demand: 500000000,
        shortage: 250000000
      },
      {
        id: "CLEAN-ENERGY-003",
        name: "Clean Energy Mission",
        department: "Power & Renewable Energy",
        current_allocation: 600000000,
        demand: 1000000000,
        shortage: 400000000
      },
      {
        id: "WATER-SUPPLY-004",
        name: "Rural Water Supply Project",
        department: "Jal Shakti",
        current_allocation: 300000000,
        demand: 550000000,
        shortage: 250000000
      },
      {
        id: "TRANSPORT-MOD-005",
        name: "Transport Modernization",
        department: "Transport",
        current_allocation: 450000000,
        demand: 750000000,
        shortage: 300000000
      }
    ]

    setUnderutilizedSchemes(underutilized)
    setHighDemandSchemes(highDemand)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const handleReallocationSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const source = underutilizedSchemes.find(s => s.id === selectedSource)
    const target = highDemandSchemes.find(s => s.id === selectedTarget)
    const amount = parseFloat(reallocationAmount)

    setTimeout(() => {
      setIsSubmitting(false)
      setIsModalOpen(false)
      alert(`✅ Reallocation Approved!\n\n₹${amount.toLocaleString('en-IN')} reallocated from:\n"${source?.name}"\n\nTo:\n"${target?.name}"\n\nStatus: Pending Finance Ministry Approval`)
      
      // Reset form
      setSelectedSource("")
      setSelectedTarget("")
      setReallocationAmount("")
    }, 1500)
  }

  const sourceScheme = underutilizedSchemes.find(s => s.id === selectedSource)
  const maxReallocation = sourceScheme?.available || 0

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center">
              <ArrowRightLeft className="w-7 h-7 mr-3" />
              Fund Reallocation Portal
            </h2>
            <p className="text-blue-100 text-sm mt-1">
              Reallocate underutilized funds to high-priority schemes
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-white text-blue-700 px-6 py-3 rounded-xl font-bold hover:bg-blue-50 transition-colors flex items-center shadow-lg"
          >
            <ArrowRightLeft className="w-5 h-5 mr-2" />
            Initiate Reallocation
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-red-700">Underutilized Funds</span>
              <TrendingDown className="w-5 h-5 text-red-500" />
            </div>
            <h3 className="text-2xl font-bold text-red-900">
              {formatCurrency(underutilizedSchemes.reduce((sum, s) => sum + s.available, 0))}
            </h3>
            <p className="text-xs text-red-600 mt-1">{underutilizedSchemes.length} schemes &lt;50% utilized</p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-green-700">High Demand Schemes</span>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <h3 className="text-2xl font-bold text-green-900">
              {formatCurrency(highDemandSchemes.reduce((sum, s) => sum + s.shortage, 0))}
            </h3>
            <p className="text-xs text-green-600 mt-1">{highDemandSchemes.length} schemes need funds</p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-700">Reallocation Potential</span>
              <AlertTriangle className="w-5 h-5 text-blue-500" />
            </div>
            <h3 className="text-2xl font-bold text-blue-900">
              {formatCurrency(Math.min(
                underutilizedSchemes.reduce((sum, s) => sum + s.available, 0),
                highDemandSchemes.reduce((sum, s) => sum + s.shortage, 0)
              ))}
            </h3>
            <p className="text-xs text-blue-600 mt-1">Can be optimally reallocated</p>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Underutilized Schemes */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <TrendingDown className="w-5 h-5 mr-2 text-red-500" />
              Underutilized Schemes
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {underutilizedSchemes.map((scheme) => (
                <div
                  key={scheme.id}
                  className="border border-red-200 rounded-lg p-4 bg-red-50/50 hover:border-red-300 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 text-sm">{scheme.name}</h4>
                      <p className="text-xs text-gray-600 mt-0.5">{scheme.department}</p>
                    </div>
                    <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded">
                      {scheme.utilization_rate}% utilized
                    </span>
                  </div>
                  
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Allocated:</span>
                      <span className="font-semibold text-gray-900">{formatCurrency(scheme.allocated)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Utilized:</span>
                      <span className="font-semibold text-gray-700">{formatCurrency(scheme.utilized)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-1">
                      <span className="text-red-700 font-medium">Available:</span>
                      <span className="font-bold text-red-700">{formatCurrency(scheme.available)}</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-red-200 flex items-center justify-between">
                    <span className="text-xs text-gray-600 flex items-center">
                      <AlertTriangle className="w-3 h-3 mr-1 text-orange-500" />
                      Deadline: {scheme.deadline_days} days
                    </span>
                    <button
                      onClick={() => {
                        setSelectedSource(scheme.id)
                        setIsModalOpen(true)
                      }}
                      className="text-xs bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 transition-colors font-medium"
                    >
                      Reallocate
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* High Demand Schemes */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
              High Priority / High Demand Schemes
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {highDemandSchemes.map((scheme) => (
                <div
                  key={scheme.id}
                  className="border border-green-200 rounded-lg p-4 bg-green-50/50 hover:border-green-300 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 text-sm">{scheme.name}</h4>
                      <p className="text-xs text-gray-600 mt-0.5">{scheme.department}</p>
                    </div>
                    <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded">
                      High Priority
                    </span>
                  </div>
                  
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Current Allocation:</span>
                      <span className="font-semibold text-gray-900">{formatCurrency(scheme.current_allocation)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Demand:</span>
                      <span className="font-semibold text-gray-700">{formatCurrency(scheme.demand)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-1">
                      <span className="text-green-700 font-medium">Shortage:</span>
                      <span className="font-bold text-green-700">{formatCurrency(scheme.shortage)}</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-green-200">
                    <div className="flex items-center text-xs text-green-700">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Eligible for additional allocation
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Reallocation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 text-white flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Initiate Fund Reallocation</h2>
                <p className="text-sm text-blue-100 mt-1">Transfer funds from underutilized to high-priority schemes</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleReallocationSubmit} className="p-6 space-y-5">
              {/* Source Scheme */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Source Scheme (Underutilized) *
                </label>
                <select
                  value={selectedSource}
                  onChange={(e) => setSelectedSource(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-600 transition-colors"
                  required
                >
                  <option value="">-- Select Source Scheme --</option>
                  {underutilizedSchemes.map((scheme) => (
                    <option key={scheme.id} value={scheme.id}>
                      {scheme.name} - Available: {formatCurrency(scheme.available)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Target Scheme */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Target Scheme (High Priority) *
                </label>
                <select
                  value={selectedTarget}
                  onChange={(e) => setSelectedTarget(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-600 transition-colors"
                  required
                >
                  <option value="">-- Select Target Scheme --</option>
                  {highDemandSchemes.map((scheme) => (
                    <option key={scheme.id} value={scheme.id}>
                      {scheme.name} - Shortage: {formatCurrency(scheme.shortage)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Reallocation Amount (₹) *
                </label>
                <input
                  type="number"
                  value={reallocationAmount}
                  onChange={(e) => setReallocationAmount(e.target.value)}
                  max={maxReallocation}
                  min={1000000}
                  step={1000000}
                  placeholder="Enter amount to reallocate"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-600 transition-colors"
                  required
                />
                {sourceScheme && (
                  <p className="text-xs text-gray-500 mt-1">
                    Maximum available: {formatCurrency(maxReallocation)}
                  </p>
                )}
              </div>

              {/* Justification */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Justification for Reallocation *
                </label>
                <textarea
                  rows={3}
                  placeholder="Provide reason for this reallocation (e.g., low utilization rate, increased demand in target scheme)"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-600 transition-colors"
                  required
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white font-semibold rounded-lg transition-all flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit for Approval
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
