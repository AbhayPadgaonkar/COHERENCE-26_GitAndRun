"use client"

export default function KPICards({ schemes, totalBudget, anomalies }) {

  const totalSchemes = schemes?.length || 0

  const criticalAnomalies = anomalies?.filter(
    (a) => a.severity === "critical"
  ).length || 0


  return (

    <div className="grid grid-cols-4 gap-6">

      {/* TOTAL SCHEMES */}

      <div className="bg-white p-6 rounded shadow">

        <p className="text-sm text-gray-500">
          Total Schemes
        </p>

        <h2 className="text-2xl font-bold mt-2">
          {totalSchemes}
        </h2>

      </div>


      {/* TOTAL BUDGET */}

      <div className="bg-white p-6 rounded shadow">

        <p className="text-sm text-gray-500">
          Total Budget
        </p>

        <h2 className="text-2xl font-bold mt-2">

          ₹{totalBudget.toLocaleString()}

        </h2>

      </div>


      {/* CRITICAL ANOMALIES */}

      <div className="bg-white p-6 rounded shadow">

        <p className="text-sm text-gray-500">
          Critical Anomalies
        </p>

        <h2 className="text-2xl font-bold mt-2 text-red-600">

          {criticalAnomalies}

        </h2>

      </div>


      {/* SYSTEM STATUS */}

      <div className="bg-white p-6 rounded shadow">

        <p className="text-sm text-gray-500">
          System Status
        </p>

        <h2 className="text-2xl font-bold mt-2 text-green-600">

          Active

        </h2>

      </div>

    </div>

  )

}