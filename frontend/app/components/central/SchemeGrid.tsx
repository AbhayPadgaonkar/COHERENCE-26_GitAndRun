"use client"

export default function SchemeGrid({ schemes }) {

  if (!schemes || schemes.length === 0) {
    return (
      <div className="bg-white p-6 rounded shadow">
        <p>No schemes available</p>
      </div>
    )
  }

  return (

    <div>

      <h2 className="text-xl font-semibold mb-4">
        Active Government Schemes
      </h2>

      <div className="grid grid-cols-3 gap-6">

        {schemes.map((scheme) => (

          <div
            key={scheme.document_id || scheme.scheme_code || scheme.id}
            className="bg-white p-6 rounded shadow hover:shadow-lg transition"
          >

            {/* Scheme Name */}

            <h3 className="text-lg font-bold">
              {scheme.name}
            </h3>

            {/* Ministry */}

            <p className="text-gray-600 mt-1">
              {scheme.ministry}
            </p>

            {/* Budget */}

            <p className="text-sm text-gray-500 mt-2">
              Budget: ₹{scheme.budget_allocated?.toLocaleString()}
            </p>

            {/* Scheme Type */}

            <span className="text-xs mt-3 bg-blue-100 text-blue-700 inline-block px-2 py-1 rounded">
              {scheme.scheme_type}
            </span>

            {/* Status */}

            <p className="text-xs mt-3">

              Status:

              <span
                className={`ml-2 px-2 py-1 rounded text-white ${
                  scheme.status === "Active"
                    ? "bg-green-600"
                    : scheme.status === "Paused"
                    ? "bg-yellow-500"
                    : "bg-red-600"
                }`}
              >
                {scheme.status}
              </span>

            </p>

          </div>

        ))}

      </div>

    </div>

  )

}