"use client"

import { useEffect, useState } from "react"
import { BarChart3 } from "lucide-react"
import { getBeneficiaryPaymentsByDistrict } from "@/lib/api"

interface PaymentStat {
  category: string
  successful: number
  pending: number
  failed: number
}

export default function BeneficiaryPaymentChart({ districtName = "Mumbai" }) {
  const [paymentStats, setPaymentStats] = useState<PaymentStat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPaymentStats()
  }, [districtName])

  const loadPaymentStats = async () => {
    try {
      setLoading(true)
      const data = await getBeneficiaryPaymentsByDistrict(districtName)
      
      // Group by beneficiary category
      const categoryMap = new Map()
      
      data.forEach((payment: any) => {
        const category = payment.beneficiary_category || 'General'
        if (!categoryMap.has(category)) {
          categoryMap.set(category, {
            category,
            successful: 0,
            pending: 0,
            failed: 0
          })
        }
        
        const stat = categoryMap.get(category)
        if (payment.payment_status === 'success') {
          stat.successful++
        } else if (payment.payment_status === 'failed') {
          stat.failed++
        } else {
          stat.pending++
        }
      })
      
      setPaymentStats(Array.from(categoryMap.values()))
    } catch (error) {
      console.error("Error loading payment stats:", error)
      setPaymentStats([])
    } finally {
      setLoading(false)
    }
  }

  const maxValue = Math.max(
    ...paymentStats.flatMap(stat => [stat.successful, stat.pending, stat.failed])
  )

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-[#000080] flex items-center">
            <BarChart3 className="w-6 h-6 mr-2 text-[#FF9933]" />
            Beneficiary Payment Status
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Category-wise payment distribution in {districtName}
          </p>
        </div>
      </div>

      {/* Chart */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#000080]"></div>
        </div>
      ) : paymentStats.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">No payment data available</p>
          <p className="text-sm text-gray-500 mt-1">Data will appear once payments are processed</p>
        </div>
      ) : (
        <>
          <div className="space-y-6">
            {paymentStats.map((stat, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">{stat.category}</span>
                  <span className="text-xs text-gray-500">
                    Total: {stat.successful + stat.pending + stat.failed}
                  </span>
                </div>
                
                {/* Stacked Bar */}
                <div className="w-full bg-gray-200 rounded-full h-8 overflow-hidden flex">
                  {stat.successful > 0 && (
                    <div 
                      className="bg-green-500 h-8 flex items-center justify-center text-xs text-white font-semibold"
                      style={{ width: `${(stat.successful / (stat.successful + stat.pending + stat.failed)) * 100}%` }}
                    >
                      {stat.successful > 0 && stat.successful}
                    </div>
                  )}
                  {stat.pending > 0 && (
                    <div 
                      className="bg-yellow-500 h-8 flex items-center justify-center text-xs text-white font-semibold"
                      style={{ width: `${(stat.pending / (stat.successful + stat.pending + stat.failed)) * 100}%` }}
                    >
                      {stat.pending > 0 && stat.pending}
                    </div>
                  )}
                  {stat.failed > 0 && (
                    <div 
                      className="bg-red-500 h-8 flex items-center justify-center text-xs text-white font-semibold"
                      style={{ width: `${(stat.failed / (stat.successful + stat.pending + stat.failed)) * 100}%` }}
                    >
                      {stat.failed > 0 && stat.failed}
                    </div>
                  )}
                </div>
                
                {/* Stats Row */}
                <div className="flex items-center justify-between mt-1 text-xs">
                  <span className="text-green-600">✓ {stat.successful} Success</span>
                  <span className="text-yellow-600">⏳ {stat.pending} Pending</span>
                  <span className="text-red-600">✗ {stat.failed} Failed</span>
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center space-x-6 mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span className="text-xs text-gray-600">Successful</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
              <span className="text-xs text-gray-600">Pending</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
              <span className="text-xs text-gray-600">Failed</span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
