"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Cell
} from "recharts"

// 1. Custom Beautiful Tooltip
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white px-4 py-3 border border-gray-100 shadow-xl rounded-xl">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
          {label}
        </p>
        <p className="text-lg font-black text-[#000080]">
          ₹{new Intl.NumberFormat('en-IN', { maximumFractionDigits: 1 }).format(payload[0].value)} Cr
        </p>
      </div>
    )
  }
  return null
}

export default function MinistryBudgetChart({ schemes }) {
  if (!schemes || schemes.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-gray-400 text-sm font-medium">
        No budget data available
      </div>
    )
  }

  // Data processing logic (Untouched)
  const ministryBudget = {}

  schemes.forEach((scheme) => {
    const ministry = scheme.ministry || "Unknown"
    if (!ministryBudget[ministry]) {
      ministryBudget[ministry] = 0
    }
    ministryBudget[ministry] += scheme.budget_allocated || 0
  })

  const chartData = Object.keys(ministryBudget).map((ministry) => ({
    ministry,
    budget: ministryBudget[ministry] / 10000000
  }))

  // Helper to shorten long X-axis labels (e.g. "Ministry of Finance" -> "Finance")
  const formatXAxis = (tickItem) => {
    let shortName = tickItem.replace("Ministry of ", "")
    return shortName.length > 12 ? shortName.substring(0, 12) + '...' : shortName
  }

  return (
    // Removed the outer box styling/title because the parent dashboard handles the frame now
    <div className="w-full h-full min-h-[300px] pt-4">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart 
          data={chartData} 
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          {/* 2. Define Gradient for Bars */}
          <defs>
            <linearGradient id="colorBudget" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#000080" stopOpacity={0.9}/>
              <stop offset="95%" stopColor="#000080" stopOpacity={0.6}/>
            </linearGradient>
          </defs>

          {/* 3. Soften the grid lines */}
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          
          {/* 4. Clean up X and Y Axes */}
          <XAxis 
            dataKey="ministry" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
            tickFormatter={formatXAxis}
            dy={10}
          />
          
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            tickFormatter={(value) => `₹${value}`}
          />
          
          {/* Custom Tooltip Integration */}
          <Tooltip 
            content={<CustomTooltip />} 
            cursor={{ fill: '#f8fafc' }} // Soft gray background when hovering over a column
          />
          
          {/* 5. Rounded, gradient bars */}
          <Bar 
            dataKey="budget" 
            fill="url(#colorBudget)" 
            radius={[6, 6, 0, 0]} // Rounds the top left and top right corners
            barSize={40} // Makes bars a consistent, pleasant width
            animationDuration={1500} // Smooth load-in animation
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}