const API_BASE = "http://localhost:8000/api/v1"

export async function getSchemes() {
  try {
    const res = await fetch(`${API_BASE}/schemes/?limit=100`)

    if (!res.ok) {
      throw new Error("Failed to fetch schemes")
    }

    return await res.json()

  } catch (error) {
    console.error("Schemes API error:", error)
    return { schemes: [] }
  }
}

export async function getAnomalies(schemeId: string) {
  try {
    if (!schemeId) return []

    const res = await fetch(`${API_BASE}/anomalies/scheme/${schemeId}`)

    if (!res.ok) {
      return []
    }

    return await res.json()

  } catch (error) {
    console.error("Anomaly API error:", error)
    return []
  }
}

export async function getIdleFunds() {
  try {
    const res = await fetch(`${API_BASE}/nodal-agencies/idle-funds`)

    if (!res.ok) {
      return []
    }

    return await res.json()

  } catch (error) {
    console.error("Idle funds API error:", error)
    return []
  }
}

// UPDATED: Function to generate scheme with precise FastAPI error handling
export async function createScheme(schemeData: any) {
  try {
    const res = await fetch(`${API_BASE}/schemes/?created_by=CentralAdmin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      // Transform and validate all required fields
      body: JSON.stringify({
        scheme_code: schemeData.scheme_code,
        name: schemeData.name,
        ministry: schemeData.ministry,
        budget_allocated: parseFloat(schemeData.budget_allocated) || 0,
        fiscal_year: parseInt(schemeData.fiscal_year) || 2024,
        budget_financial_year: schemeData.budget_financial_year || "2024-2025",
        scheme_type: schemeData.scheme_type,
        target_beneficiaries: parseInt(schemeData.target_beneficiaries) || 0,
        beneficiary_category: schemeData.beneficiary_category,
        launch_date: schemeData.launch_date,
        status: schemeData.status || "Active",
        priority: schemeData.priority || "medium",
        coverage_states: Array.isArray(schemeData.coverage_states) 
          ? schemeData.coverage_states 
          : [schemeData.coverage_states],
        coverage_type: schemeData.coverage_type || "National",
        description: schemeData.description || ""
      }),
    })

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      
      let errorMessage = "Failed to create scheme";
      
      // Check if it's a FastAPI 422 Validation Error (which is an array of objects)
      if (Array.isArray(errorData.detail)) {
        // Map over the array to extract exactly WHICH field failed and WHY
        errorMessage = errorData.detail
          .map((err: any) => `Field '${err.loc[err.loc.length - 1]}': ${err.msg}`)
          .join(" | ");
      } else if (typeof errorData.detail === "string") {
        errorMessage = errorData.detail;
      }

      console.error("FastAPI Validation Error:", errorMessage);
      throw new Error(errorMessage); // Throw string so the frontend alert() can read it
    }

    return await res.json()

  } catch (error) {
    console.error("Create scheme API error:", error)
    // IMPORTANT: Throw the error instead of returning it, so your component's catch block triggers
    throw error 
  }
}

// ============ FUND FLOW APIs ============

export async function createFundFlow(flowData: any) {
  try {
    const res = await fetch(`${API_BASE}/funds/track`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        scheme_id: flowData.scheme_id,
        fund_flow_reference: flowData.fund_flow_reference,
        from_level: flowData.from_level,
        to_level: flowData.to_level,
        from_entity_code: flowData.from_entity_code,
        to_entity_code: flowData.to_entity_code,
        from_entity_name: flowData.from_entity_name,
        to_entity_name: flowData.to_entity_name,
        amount: parseFloat(flowData.amount),
        currency: "INR",
        payment_mode: flowData.payment_mode,
        sanction_date: flowData.sanction_date,
        transfer_date: flowData.transfer_date,
        status: flowData.status,
        installment_number: parseInt(flowData.installment_number) || 1,
        total_installments: parseInt(flowData.total_installments) || 1,
        release_type: flowData.release_type || "FIRST_INSTALLMENT",
        delay_days: 0
      }),
    })

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      let errorMessage = "Failed to create fund flow"
      
      if (Array.isArray(errorData.detail)) {
        errorMessage = errorData.detail
          .map((err: any) => `Field '${err.loc[err.loc.length - 1]}': ${err.msg}`)
          .join(" | ")
      } else if (typeof errorData.detail === "string") {
        errorMessage = errorData.detail
      }
      
      throw new Error(errorMessage)
    }

    return await res.json()

  } catch (error) {
    console.error("Create fund flow API error:", error)
    throw error
  }
}

export async function getFundFlowsByScheme(schemeId: string) {
  try {
    const res = await fetch(`${API_BASE}/funds/scheme/${schemeId}/flow`)

    if (!res.ok) {
      return []
    }

    return await res.json()

  } catch (error) {
    console.error("Fund flows API error:", error)
    return []
  }
}

export async function getTotalTransferred(schemeId: string) {
  try {
    const res = await fetch(`${API_BASE}/funds/scheme/${schemeId}/total-transferred`)

    if (!res.ok) {
      return { total_transferred: 0 }
    }

    return await res.json()

  } catch (error) {
    console.error("Total transferred API error:", error)
    return { total_transferred: 0 }
  }
}

// ============ STATE DASHBOARD APIs ============

export async function getDistrictsByState(stateName: string) {
  try {
    // Get all schemes to find ones that involve this state
    const schemesRes = await fetch(`${API_BASE}/schemes/?limit=100`)
    if (!schemesRes.ok) return []
    
    const schemesData = await schemesRes.json()
    const schemes = schemesData.schemes || []
    
    // Get fund flows and filter by district level
    const allFlows = await Promise.all(
      schemes.map(async (scheme: any) => {
        const flows = await getFundFlowsByScheme(scheme.id || scheme.scheme_code)
        return flows.filter((flow: any) => 
          flow.to_level === 'DISTRICT' && 
          (flow.from_entity_name?.toLowerCase().includes(stateName.toLowerCase()) ||
           flow.to_entity_name?.toLowerCase().includes(stateName.toLowerCase()))
        )
      })
    )
    
    const districtFlows = allFlows.flat()
    
    // Group by district to calculate stats
    const districtMap = new Map()
    
    districtFlows.forEach(flow => {
      const districtName = flow.to_entity_name
      if (!districtMap.has(districtName)) {
        districtMap.set(districtName, {
          name: districtName,
          code: flow.to_entity_code,
          funds_received: 0,
          funds_utilized: 0,
          scheme_count: new Set()
        })
      }
      
      const district = districtMap.get(districtName)
      district.funds_received += parseFloat(flow.amount) || 0
      district.scheme_count.add(flow.scheme_id)
      
      // Estimate utilization (70-95% random for demo)
      if (district.funds_utilized === 0) {
        district.funds_utilized = district.funds_received * (0.7 + Math.random() * 0.25)
      }
    })
    
    // Convert to array and add calculated fields
    return Array.from(districtMap.values()).map(district => ({
      id: district.code,
      name: district.name,
      code: district.code,
      funds_received: district.funds_received,
      funds_utilized: district.funds_utilized,
      utilization_percentage: district.funds_received > 0 
        ? Math.round((district.funds_utilized / district.funds_received) * 100) 
        : 0,
      scheme_count: district.scheme_count.size,
      status: (() => {
        const util = district.funds_utilized / district.funds_received * 100
        if (util >= 80) return 'on_track'
        if (util >= 60) return 'attention'
        return 'critical'
      })()
    }))
    
  } catch (error) {
    console.error("Districts API error:", error)
    return []
  }
}

export async function getStateAnomalies(stateName: string) {
  try {
    // Get all schemes
    const schemesRes = await fetch(`${API_BASE}/schemes/?limit=100`)
    if (!schemesRes.ok) return []
    
    const schemesData = await schemesRes.json()
    const schemes = schemesData.schemes || []
    
    // Get anomalies for all schemes and filter by state
    const allAnomalies = await Promise.all(
      schemes.map(async (scheme: any) => {
        const anomalies = await getAnomalies(scheme.id || scheme.scheme_code)
        return anomalies.map((anomaly: any) => ({
          ...anomaly,
          scheme_name: scheme.name,
          scheme_code: scheme.scheme_code
        }))
      })
    )
    
    const stateAnomalies = allAnomalies
      .flat()
      .filter(anomaly => 
        anomaly.description?.toLowerCase().includes(stateName.toLowerCase()) ||
        anomaly.location?.toLowerCase().includes(stateName.toLowerCase()) ||
        anomaly.entity_name?.toLowerCase().includes(stateName.toLowerCase())
      )
      .sort((a, b) => {
        const severityOrder: any = { high: 0, medium: 1, low: 2 }
        return severityOrder[a.severity] - severityOrder[b.severity]
      })
      .slice(0, 10) // Top 10 anomalies
    
    return stateAnomalies
    
  } catch (error) {
    console.error("State anomalies API error:", error)
    return []
  }
}

export async function getDistrictPerformance(stateName: string) {
  try {
    const districts = await getDistrictsByState(stateName)
    
    return districts.map(district => ({
      district: district.name,
      utilization: district.utilization_percentage,
      funds_received: district.funds_received,
      funds_utilized: district.funds_utilized
    }))
    
  } catch (error) {
    console.error("District performance API error:", error)
    return []
  }
}

// ============ DISTRICT DASHBOARD APIs ============

export async function getBeneficiaryPaymentsByDistrict(districtName: string) {
  try {
    // Get all schemes
    const schemesRes = await fetch(`${API_BASE}/schemes/?limit=100`)
    if (!schemesRes.ok) return []
    
    const schemesData = await schemesRes.json()
    const schemes = schemesData.schemes || []
    
    // Get beneficiary payments for all schemes
    const allPayments = await Promise.all(
      schemes.map(async (scheme: any) => {
        try {
          const res = await fetch(`${API_BASE}/beneficiary-payments/scheme/${scheme.id || scheme.scheme_code}/payments`)
          if (!res.ok) return []
          return await res.json()
        } catch {
          return []
        }
      })
    )
    
    // Filter payments by district
    const districtPayments = allPayments
      .flat()
      .filter(payment => 
        payment.beneficiary_location?.toLowerCase().includes(districtName.toLowerCase()) ||
        payment.district?.toLowerCase().includes(districtName.toLowerCase())
      )
    
    return districtPayments
    
  } catch (error) {
    console.error("Beneficiary payments API error:", error)
    return []
  }
}

export async function getDistrictAnomalies(districtName: string) {
  try {
    // Get all schemes
    const schemesRes = await fetch(`${API_BASE}/schemes/?limit=100`)
    if (!schemesRes.ok) return []
    
    const schemesData = await schemesRes.json()
    const schemes = schemesData.schemes || []
    
    // Get anomalies for all schemes and filter by district
    const allAnomalies = await Promise.all(
      schemes.map(async (scheme: any) => {
        const anomalies = await getAnomalies(scheme.id || scheme.scheme_code)
        return anomalies.map((anomaly: any) => ({
          ...anomaly,
          scheme_name: scheme.name,
          scheme_code: scheme.scheme_code
        }))
      })
    )
    
    const districtAnomalies = allAnomalies
      .flat()
      .filter(anomaly => 
        anomaly.description?.toLowerCase().includes(districtName.toLowerCase()) ||
        anomaly.location?.toLowerCase().includes(districtName.toLowerCase()) ||
        anomaly.entity_name?.toLowerCase().includes(districtName.toLowerCase())
      )
      .sort((a, b) => {
        const severityOrder: any = { high: 0, medium: 1, low: 2 }
        return severityOrder[a.severity] - severityOrder[b.severity]
      })
      .slice(0, 10) // Top 10 anomalies
    
    return districtAnomalies
    
  } catch (error) {
    console.error("District anomalies API error:", error)
    return []
  }
}