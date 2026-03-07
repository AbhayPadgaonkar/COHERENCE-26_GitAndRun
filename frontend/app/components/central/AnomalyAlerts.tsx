"use client"

export default function AnomalyAlerts({ anomalies }) {

  if (!anomalies || anomalies.length === 0) {

    return (
      <div className="bg-white p-6 rounded shadow">

        <h2 className="text-lg font-semibold mb-3">
          Anomaly Alerts
        </h2>

        <p className="text-green-600">
          No anomalies detected
        </p>

      </div>
    )
  }

  return (

    <div className="bg-white p-6 rounded shadow">

      <h2 className="text-lg font-semibold mb-4">
        Anomaly Alerts
      </h2>

      <div className="space-y-3">

        {anomalies.map((anomaly) => (

          <div
            key={anomaly.document_id || anomaly.id}
            className={`p-3 rounded border-l-4
              ${
                anomaly.severity === "critical"
                ? "border-red-600 bg-red-50"
                : anomaly.severity === "warning"
                ? "border-yellow-500 bg-yellow-50"
                : "border-blue-500 bg-blue-50"
              }
            `}
          >

            <p className="font-medium">
              {anomaly.anomaly_type}
            </p>

            <p className="text-sm text-gray-600">
              {anomaly.description}
            </p>

          </div>

        ))}

      </div>

    </div>

  )

}