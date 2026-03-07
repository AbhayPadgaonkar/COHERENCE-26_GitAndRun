"use client"

import { useEffect, useState } from "react"
import { MapPin, TrendingUp, TrendingDown, AlertCircle, CheckCircle, Clock, DollarSign } from "lucide-react"
import { getDistrictsByState } from "@/lib/api"

interface District {
  id: string
  name: string
  code?: string
  funds_received: number
  funds_utilized: number
  utilization_percentage: number
  pending_amount?: number
  status: string
  last_transaction_date?: string
  scheme_count?: number
}

export default function DistrictMonitor({ stateName = "Maharashtra" }) {
  const [districts, setDistricts] = useState<District[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "on_track" | "attention" | "critical">("all")

  useEffect(() => {
    loadDistricts()
  }, [stateName])

  const loadDistricts = async () => {
    try {
      setLoading(true)
      const data = await getDistrictsByState(stateName)
      
      // Transform API data to component format
      const formattedDistricts = data.map(district => ({
        id: district.id || district.code,
        name: district.name,
        code: district.code,
        funds_received: district.funds_received,
        funds_utilized: district.funds_utilized,
        utilization_percentage: district.utilization_percentage,
        pending_amount: district.funds_received - district.funds_utilized,
        status: district.status,
        last_transaction_date: new Date().toISOString().split('T')[0],
        scheme_count: district.scheme_count || 0
      }))
      
      setDistricts(formattedDistricts)
    } catch (error) {
      console.error("Error loading districts:", error)
      setDistricts([])
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

  const formatDate = (dateString: string) => {
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
      case 'attention_needed':
        return <Clock className="w-5 h-5 text-yellow-500" />
      case 'critical':
        return <AlertCircle className="w-5 h-5 text-red-500" />
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on_track':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'attention_needed':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'critical':
        return 'bg-red-100 text-red-700 border-red-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getUtilizationColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500'
    if (percentage >= 60) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const filteredDistricts = filter === 'all' 
    ? districts 
    : districts.filter(d => d.status === filter)

  const totalFundsReceived = districts.reduce((sum, d) => sum + d.funds_received, 0)
  const totalFundsUtilized = districts.reduce((sum, d) => sum + d.funds_utilized, 0)
  const avgUtilization = districts.length > 0 
    ? (totalFundsUtilized / totalFundsReceived * 100).toFixed(1)
    : 0

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-[#000080] flex items-center">
            <MapPin className="w-6 h-6 mr-2 text-[#FF9933]" />
            District Monitor
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Real-time tracking of fund utilization across {districts.length} districts
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
          <p className="text-sm opacity-90 mb-1">Total Allocated</p>
          <h3 className="text-2xl font-bold">{formatCurrency(totalFundsReceived)}</h3>
          <p className="text-xs opacity-75 mt-2">{districts.length} districts</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
          <p className="text-sm opacity-90 mb-1">Total Utilized</p>
          <h3 className="text-2xl font-bold">{formatCurrency(totalFundsUtilized)}</h3>
          <p className="text-xs opacity-75 mt-2">{avgUtilization}% average utilization</p>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-4 text-white">
          <p className="text-sm opacity-90 mb-1">Pending</p>
          <h3 className="text-2xl font-bold">{formatCurrency(totalFundsReceived - totalFundsUtilized)}</h3>
          <p className="text-xs opacity-75 mt-2">
            {districts.filter(d => d.status === 'critical').length} districts need attention
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
          All Districts ({districts.length})
        </button>
        <button
          onClick={() => setFilter("on_track")}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            filter === "on_track"
              ? "text-green-600 border-b-2 border-green-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          On Track ({districts.filter(d => d.status === 'on_track').length})
        </button>
        <button
          onClick={() => setFilter("attention")}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            filter === "attention"
              ? "text-yellow-600 border-b-2 border-yellow-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Attention ({districts.filter(d => d.status === 'attention').length})
        </button>
        <button
          onClick={() => setFilter("critical")}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            filter === "critical"
              ? "text-red-600 border-b-2 border-red-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Critical ({districts.filter(d => d.status === 'critical').length})
        </button>
      </div>

      {/* Districts List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#000080]"></div>
        </div>
      ) : filteredDistricts.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">No districts in this category</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredDistricts.map((district) => (
            <div 
              key={district.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              {/* District Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(district.status)}
                  <div>
                    <h3 className="font-bold text-gray-900">{district.name}</h3>
                    <p className="text-xs text-gray-500">{district.scheme_count || 0} active schemes</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full border font-semibold ${getStatusColor(district.status)}`}>
                  {district.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>

              {/* Utilization Progress Bar */}
              <div className="mb-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-gray-600">Fund Utilization</span>
                  <span className="text-sm font-bold text-gray-900">{district.utilization_percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all ${getUtilizationColor(district.utilization_percentage)}`}
                    style={{ width: `${district.utilization_percentage}%` }}
                  ></div>
                </div>
              </div>

              {/* Financial Details */}
              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-100">
                <div>
                  <p className="text-xs text-gray-500">Received</p>
                  <p className="text-sm font-semibold text-gray-900">{formatCurrency(district.funds_received)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Utilized</p>
                  <p className="text-sm font-semibold text-green-600">{formatCurrency(district.funds_utilized)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Pending</p>
                  <p className="text-sm font-semibold text-amber-600">{formatCurrency(district.pending_amount || 0)}</p>
                </div>
              </div>

              {/* Last Activity */}
              <div className="mt-2 text-xs text-gray-500 flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                Last transaction: {formatDate(district.last_transaction_date || new Date().toISOString())}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
