"use client"

import { useEffect, useState } from "react"
import { Users, TrendingUp, TrendingDown, AlertCircle, CheckCircle, Clock, DollarSign } from "lucide-react"
import { getBeneficiaryPaymentsByDistrict } from "@/lib/api"

interface Block {
  id: string
  name: string
  beneficiaries_total: number
  beneficiaries_paid: number
  amount_disbursed: number
  payment_percentage: number
  pending_amount: number
  status: "on_track" | "attention" | "critical"
  last_payment_date?: string
}

export default function BlockMonitor({ districtName = "Mumbai" }) {
  const [blocks, setBlocks] = useState<Block[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "on_track" | "attention" | "critical">("all")

  useEffect(() => {
    loadBlocks()
  }, [districtName])

  const loadBlocks = async () => {
    try {
      setLoading(true)
      const data = await getBeneficiaryPaymentsByDistrict(districtName)
      
      // Group payments by block/location to create block-level stats
      const blockMap = new Map()
      
      data.forEach((payment: any) => {
        const blockName = payment.beneficiary_location || `${districtName} Block`
        if (!blockMap.has(blockName)) {
          blockMap.set(blockName, {
            name: blockName,
            beneficiaries_total: 0,
            beneficiaries_paid: 0,
            amount_disbursed: 0,
            pending_amount: 0
          })
        }
        
        const block = blockMap.get(blockName)
        block.beneficiaries_total++
        if (payment.payment_status === 'success') {
          block.beneficiaries_paid++
          block.amount_disbursed += parseFloat(payment.amount) || 0
        } else {
          block.pending_amount += parseFloat(payment.amount) || 0
        }
      })
      
      // Convert to array and add calculated fields
      const blocksArray = Array.from(blockMap.values()).map((block: any, index) => ({
        id: `block-${index}`,
        name: block.name,
        beneficiaries_total: block.beneficiaries_total,
        beneficiaries_paid: block.beneficiaries_paid,
        amount_disbursed: block.amount_disbursed,
        payment_percentage: block.beneficiaries_total > 0 
          ? Math.round((block.beneficiaries_paid / block.beneficiaries_total) * 100) 
          : 0,
        pending_amount: block.pending_amount,
        status: (() => {
          const pct = (block.beneficiaries_paid / block.beneficiaries_total) * 100
          if (pct >= 80) return 'on_track'
          if (pct >= 60) return 'attention'
          return 'critical'
        })(),
        last_payment_date: new Date().toISOString().split('T')[0]
      }))
      
      setBlocks(blocksArray)
    } catch (error) {
      console.error("Error loading blocks:", error)
      setBlocks([])
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'on_track':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'attention':
        return <Clock className="w-5 h-5 text-yellow-500" />
      case 'critical':
        return <AlertCircle className="w-5 h-5 text-red-500" />
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />
    }
  }

  const filteredBlocks = filter === "all" ? blocks : blocks.filter((b) => b.status === filter)

  const totalBeneficiaries = blocks.reduce((sum, b) => sum + b.beneficiaries_total, 0)
  const totalPaid = blocks.reduce((sum, b) => sum + b.beneficiaries_paid, 0)
  const totalDisbursed = blocks.reduce((sum, b) => sum + b.amount_disbursed, 0)
  const avgPayment = totalBeneficiaries > 0 ? Math.round((totalPaid / totalBeneficiaries) * 100) : 0

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-[#000080] flex items-center">
            <Users className="w-6 h-6 mr-2 text-[#FF9933]" />
            Block/Beneficiary Monitor
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Real-time tracking of beneficiary payments across {blocks.length} blocks
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
          <p className="text-sm opacity-90 mb-1">Total Beneficiaries</p>
          <h3 className="text-2xl font-bold">{totalBeneficiaries.toLocaleString()}</h3>
          <p className="text-xs opacity-75 mt-2">{blocks.length} blocks</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
          <p className="text-sm opacity-90 mb-1">Payments Made</p>
          <h3 className="text-2xl font-bold">{totalPaid.toLocaleString()}</h3>
          <p className="text-xs opacity-75 mt-2">{avgPayment}% completion rate</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white">
          <p className="text-sm opacity-90 mb-1">Amount Disbursed</p>
          <h3 className="text-2xl font-bold">{formatCurrency(totalDisbursed)}</h3>
          <p className="text-xs opacity-75 mt-2">
            {blocks.filter(b => b.status === 'critical').length} blocks need attention
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2 mb-4 border-b border-gray-200">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            filter === "all"
              ? "text-[#000080] border-b-2 border-[#000080]"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          All Blocks ({blocks.length})
        </button>
        <button
          onClick={() => setFilter("on_track")}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            filter === "on_track"
              ? "text-green-600 border-b-2 border-green-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          On Track ({blocks.filter(b => b.status === 'on_track').length})
        </button>
        <button
          onClick={() => setFilter("attention")}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            filter === "attention"
              ? "text-yellow-600 border-b-2 border-yellow-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Attention ({blocks.filter(b => b.status === 'attention').length})
        </button>
        <button
          onClick={() => setFilter("critical")}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            filter === "critical"
              ? "text-red-600 border-b-2 border-red-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Critical ({blocks.filter(b => b.status === 'critical').length})
        </button>
      </div>

      {/* Blocks List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#000080]"></div>
        </div>
      ) : filteredBlocks.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">No blocks in this category</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredBlocks.map((block) => (
            <div 
              key={block.id}
              className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                block.status === 'critical' ? 'border-red-300 bg-red-50/30' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(block.status)}
                  <div>
                    <h3 className="font-bold text-gray-900">{block.name}</h3>
                    <p className="text-xs text-gray-500">
                      {block.beneficiaries_paid} / {block.beneficiaries_total} beneficiaries paid
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-[#000080]">{block.payment_percentage}%</p>
                  <p className="text-xs text-gray-500">Completion</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-3">
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-2 rounded-full transition-all ${
                      block.payment_percentage >= 80 ? 'bg-green-500' :
                      block.payment_percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${block.payment_percentage}%` }}
                  ></div>
                </div>
              </div>

              {/* Block Stats */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-gray-600">Amount Disbursed</p>
                  <p className="text-sm font-semibold text-green-600">{formatCurrency(block.amount_disbursed)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Pending</p>
                  <p className="text-sm font-semibold text-amber-600">{formatCurrency(block.pending_amount || 0)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
