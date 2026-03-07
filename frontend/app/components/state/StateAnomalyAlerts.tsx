"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, Clock, XCircle, AlertCircle, TrendingDown } from "lucide-react"
import { getStateAnomalies } from "@/lib/api"

interface Anomaly {
  id: string
  anomaly_type: string
  severity: "high" | "medium" | "low"
  description: string
  amount_involved?: number
  detected_date: string
  scheme_name?: string
  scheme_code?: string
  location?: string
  entity_name?: string
}

export default function StateAnomalyAlerts({ stateName = "Maharashtra" }) {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnomalies()
  }, [stateName])

  const loadAnomalies = async () => {
    try {
      setLoading(true)
      const data = await getStateAnomalies(stateName)
      setAnomalies(data)
    } catch (error) {
      console.error("Error loading anomalies:", error)
      setAnomalies([])
    } finally {
      setLoading(false)
    }
  }

  const getAnimalyIcon = (type: string) => {
    const lowerType = type?.toLowerCase() || ''
    if (lowerType.includes('delay') || lowerType.includes('time')) {
      return <Clock className="w-5 h-5" />
    }
    if (lowerType.includes('leak') || lowerType.includes('diversion')) {
      return <AlertTriangle className="w-5 h-5" />
    }
    if (lowerType.includes('irregular') || lowerType.includes('mismatch')) {
      return <XCircle className="w-5 h-5" />
    }
    return <AlertCircle className="w-5 h-5" />
  }

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-300'
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300'
      case 'low':
        return 'bg-blue-100 text-blue-700 border-blue-300'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300'
    }
  }

  const getTypeColor = (type: string) => {
    const lowerType = type?.toLowerCase() || ''
    if (lowerType.includes('delay')) {
      return 'text-blue-600 bg-blue-50 border-blue-200'
    }
    if (lowerType.includes('leak') || lowerType.includes('diversion')) {
      return 'text-red-600 bg-red-50 border-red-200'
    }
    if (lowerType.includes('irregular')) {
      return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    }
    return 'text-purple-600 bg-purple-50 border-purple-200'
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const highSeverityCount = anomalies.filter(a => a.severity === 'high').length

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-red-600 flex items-center">
            <AlertTriangle className="w-6 h-6 mr-2" />
            State Anomaly Alerts
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            AI-detected irregularities requiring immediate attention
          </p>
        </div>
        {highSeverityCount > 0 && (
          <div className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold border border-red-300">
            {highSeverityCount} High Priority
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        </div>
      ) : anomalies.length === 0 ? (
        <div className="text-center py-12 bg-green-50 rounded-lg border-2 border-dashed border-green-300">
          <AlertCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <p className="text-green-700 font-medium">No anomalies detected</p>
          <p className="text-sm text-green-600 mt-1">All systems operating normally</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {anomalies.map((anomaly) => (
            <div 
              key={anomaly.id}
              className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                anomaly.severity === 'high' ? 'border-red-300 bg-red-50/30' : 'border-gray-200'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className={`${getTypeColor(anomaly.anomaly_type)} p-1 rounded`}>
                    {getAnimalyIcon(anomaly.anomaly_type)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs px-2 py-1 rounded-full border font-semibold ${getTypeColor(anomaly.anomaly_type)}`}>
                        {(anomaly.anomaly_type || 'ALERT').toUpperCase().replace('_', ' ')}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full border font-semibold ${getSeverityColor(anomaly.severity)}`}>
                        {anomaly.severity.toUpperCase()} PRIORITY
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="mb-3">
                <p className="text-sm font-medium text-gray-900 mb-1">{anomaly.description}</p>
                <div className="flex items-center space-x-4 text-xs text-gray-600">
                  {(anomaly.entity_name || anomaly.location) && (
                    <>
                      <span className="font-semibold">Location: {anomaly.entity_name || anomaly.location}</span>
                      {anomaly.scheme_name && <span>•</span>}
                    </>
                  )}
                  {anomaly.scheme_name && (
                    <span>Scheme: {anomaly.scheme_name}</span>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                <div className="text-xs text-gray-500">
                  Detected: {formatDate(anomaly.detected_date)}
                </div>
                {anomaly.amount_involved && anomaly.amount_involved > 0 && (
                  <div className="text-sm font-bold text-red-600">
                    {formatCurrency(anomaly.amount_involved)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
