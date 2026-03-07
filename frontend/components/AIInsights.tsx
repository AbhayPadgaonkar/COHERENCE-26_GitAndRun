"use client"

import { useState, useEffect } from "react"
import { Sparkles, RefreshCw, Loader2, AlertCircle } from "lucide-react"

interface AIInsightsProps {
  insights: string
  confidence: string
  generatedAt: string
  onRefresh?: () => void
  isLoading?: boolean
  title?: string
  accentColor?: string
}

export default function AIInsights({
  insights,
  confidence,
  generatedAt,
  onRefresh,
  isLoading = false,
  title = "AI-Powered Insights",
  accentColor = "#000080"
}: AIInsightsProps) {
  
  // Format the insights text with proper line breaks and emoji rendering
  const formatInsights = (text: string) => {
    if (!text) return []
    
    // Split by line breaks and filter out empty lines
    const lines = text.split('\n').filter(line => line.trim().length > 0)
    return lines
  }

  const formattedInsights = formatInsights(insights)
  
  // Format the timestamp
  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp)
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      })
    } catch {
      return 'Just now'
    }
  }

  // Get confidence indicator
  const getConfidenceIndicator = () => {
    if (confidence === 'high') {
      return (
        <span className="inline-flex items-center space-x-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded-full">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
          <span>High Confidence</span>
        </span>
      )
    } else if (confidence === 'medium') {
      return (
        <span className="inline-flex items-center space-x-1 text-xs font-medium text-yellow-700 bg-yellow-50 px-2 py-1 rounded-full">
          <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></span>
          <span>Medium Confidence</span>
        </span>
      )
    } else {
      return (
        <span className="inline-flex items-center space-x-1 text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
          <AlertCircle className="w-3 h-3" />
          <span>Fallback Mode</span>
        </span>
      )
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div 
        className="p-4 border-b border-gray-100 flex items-center justify-between"
        style={{ 
          background: `linear-gradient(135deg, ${accentColor}15 0%, ${accentColor}05 100%)` 
        }}
      >
        <div className="flex items-center space-x-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${accentColor}20` }}
          >
            <Sparkles className="w-5 h-5" style={{ color: accentColor }} />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">{title}</h3>
            <p className="text-xs text-gray-500 flex items-center space-x-2 mt-0.5">
              <span>Powered by Gemini AI</span>
              <span>•</span>
              <span>{formatTime(generatedAt)}</span>
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {getConfidenceIndicator()}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh insights"
            >
              <RefreshCw 
                className={`w-4 h-4 text-gray-600 ${isLoading ? 'animate-spin' : ''}`} 
              />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: accentColor }} />
            <p className="text-sm text-gray-500">Generating AI insights...</p>
          </div>
        ) : formattedInsights.length > 0 ? (
          <div className="space-y-3">
            {formattedInsights.map((line, index) => (
              <div 
                key={index} 
                className="flex items-start space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
              >
                <div className="flex-1">
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {line}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No insights available</p>
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="mt-3 text-sm font-medium hover:underline"
                style={{ color: accentColor }}
              >
                Try generating insights
              </button>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      {!isLoading && formattedInsights.length > 0 && (
        <div className="px-5 pb-4 pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-400 text-center">
            AI-generated insights are recommendations. Please verify critical decisions with domain experts.
          </p>
        </div>
      )}
    </div>
  )
}
