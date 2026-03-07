"use client"

import { useEffect, useState } from "react"
import { BarChart3 } from "lucide-react"
import { getDistrictPerformance } from "@/lib/api"

interface District {
  district: string
  utilization: number
  funds_received: number
  funds_utilized: number
}

export default function DistrictPerformanceChart({ stateName = "Maharashtra" }) {
  const [districts, setDistricts] = useState<District[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPerformance()
  }, [stateName])

  const loadPerformance = async () => {
    try {
      setLoading(true)
      const data = await getDistrictPerformance(stateName)
      setDistricts(data)
    } catch (error) {
      console.error("Error loading district performance:", error)
      setDistricts([])
    } finally {
      setLoading(false)
    }
  }

  const getBarColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500'
    if (percentage >= 60) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const maxValue = Math.max(...districts.map(d => d.utilization))

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-[#000080] flex items-center">
            <BarChart3 className="w-6 h-6 mr-2 text-[#FF9933]" />
            District Utilization Performance
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Fund utilization comparison across {stateName} districts
          </p>
        </div>
      </div>

      {/* Chart */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#000080]"></div>
        </div>
      ) : districts.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">No district data available</p>
          <p className="text-sm text-gray-500 mt-1">Data will appear once districts receive funds</p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {districts.map((district, index) => (
              <div key={index} className="group">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700 min-w-[100px]">
                    {district.district}
                  </span>
                  <span className={`text-sm font-bold ${
                    district.utilization >= 80 ? 'text-green-600' : 
                    district.utilization >= 60 ? 'text-yellow-600' : 
                    'text-red-600'
                  }`}>
                    {district.utilization}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div 
                    className={`h-3 rounded-full transition-all duration-500 ease-out group-hover:opacity-80 ${getBarColor(district.utilization)}`}
                    style={{ width: `${district.utilization}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center space-x-6 mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span className="text-xs text-gray-600">Excellent (≥80%)</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
              <span className="text-xs text-gray-600">Moderate (60-79%)</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
              <span className="text-xs text-gray-600">Poor (&lt;60%)</span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
