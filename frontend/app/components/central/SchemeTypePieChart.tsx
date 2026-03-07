"use client"

import {
  PieChart,
  Pie,
  Tooltip,
  Cell,
  ResponsiveContainer,
  Legend,
  Label
} from "recharts"

// LokNidhi Gradient Map
const GRADIENTS = [
  "url(#colorNavy)", 
  "url(#colorSaffron)", 
  "url(#colorGreen)", 
  "url(#colorBlue)", 
  "url(#colorGold)"
]

const RAW_COLORS = ["#000080", "#FF9933", "#138808", "#3b82f6", "#f59e0b"]

// Custom Floating Tooltip
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/90 backdrop-blur-md px-5 py-4 border border-gray-100 shadow-2xl rounded-2xl flex flex-col items-center justify-center transform scale-105 transition-transform">
        <p className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-1">
          {payload[0].name}
        </p>
        <p className="text-3xl font-black" style={{ color: RAW_COLORS[payload[0].payload.fillIndex % RAW_COLORS.length] }}>
          {payload[0].value}
        </p>
        <p className="text-xs font-bold text-gray-400 mt-1">Active Schemes</p>
      </div>
    )
  }
  return null
}

// Custom Pill-shaped Legend
const CustomLegend = ({ payload }) => {
  return (
    <div className="flex flex-wrap justify-center gap-2 mt-2 px-2">
      {payload.map((entry, index) => (
        <div 
          key={`item-${index}`} 
          className="flex items-center bg-gray-50 hover:bg-gray-100 transition-colors px-3 py-1.5 rounded-full border border-gray-200 cursor-default shadow-sm"
        >
          <div 
            className="w-2.5 h-2.5 rounded-full mr-2 shadow-sm" 
            style={{ backgroundColor: RAW_COLORS[index % RAW_COLORS.length] }} 
          />
          <span className="text-xs font-bold text-gray-700">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function SchemeTypePieChart({ schemes }) {
  if (!schemes || schemes.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-gray-400 text-sm font-medium bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 m-4">
        No scheme data available
      </div>
    )
  }

  // Data processing logic (Untouched)
  const typeCounts = {}

  schemes.forEach((scheme) => {
    const type = scheme.scheme_type || "Other"
    if (!typeCounts[type]) {
      typeCounts[type] = 0
    }
    typeCounts[type]++
  })

  const chartData = Object.keys(typeCounts).map((type, index) => ({
    name: type,
    value: typeCounts[type],
    fillIndex: index // Store index to map back to RAW_COLORS in the tooltip
  }))

  const totalSchemes = chartData.reduce((acc, curr) => acc + curr.value, 0)

  return (
    <div className="w-full h-full min-h-[320px] flex flex-col items-center justify-center pt-2 relative">
      
      {/* Decorative background glow */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-[#000080]/5 rounded-full blur-3xl"></div>

      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          {/* Define Premium SVG Gradients */}
          <defs>
            <linearGradient id="colorNavy" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#000080" stopOpacity={1}/>
              <stop offset="95%" stopColor="#040466" stopOpacity={1}/>
            </linearGradient>
            <linearGradient id="colorSaffron" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#FF9933" stopOpacity={1}/>
              <stop offset="95%" stopColor="#ea580c" stopOpacity={1}/>
            </linearGradient>
            <linearGradient id="colorGreen" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#138808" stopOpacity={1}/>
              <stop offset="95%" stopColor="#0d5c05" stopOpacity={1}/>
            </linearGradient>
            <linearGradient id="colorBlue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={1}/>
              <stop offset="95%" stopColor="#1d4ed8" stopOpacity={1}/>
            </linearGradient>
            <linearGradient id="colorGold" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#facc15" stopOpacity={1}/>
              <stop offset="95%" stopColor="#ca8a04" stopOpacity={1}/>
            </linearGradient>
          </defs>

          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={75} // Thinner, more elegant ring
            outerRadius={105}
            paddingAngle={4} // Slightly larger gap between slices
            stroke="none"
            animationDuration={1500}
            animationBegin={200}
            cornerRadius={6} // Rounds the edges of each slice!
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={GRADIENTS[index % GRADIENTS.length]} 
                style={{ filter: `drop-shadow(0px 4px 6px rgba(0,0,0,0.1))` }} // Adds a 3D shadow to slices
              />
            ))}
            
            {/* Center Label for Total Schemes */}
            <Label 
              value={totalSchemes} 
              position="centerBottom" 
              className="text-4xl font-black fill-[#000080]"
              dy={-5}
            />
            <Label 
              value="Total Schemes" 
              position="centerTop" 
              className="text-[10px] font-extrabold fill-gray-400 uppercase tracking-widest"
              dy={18}
            />
          </Pie>
          
          <Tooltip content={<CustomTooltip />} cursor={false} />
        </PieChart>
      </ResponsiveContainer>

      {/* Render the Custom Pill Legend below the chart */}
      <div className="w-full mt-2">
        <ResponsiveContainer width="100%" height={50}>
          <PieChart>
             <Legend content={<CustomLegend />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

    </div>
  )
}