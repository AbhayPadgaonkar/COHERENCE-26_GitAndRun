'use client'

import { useState } from 'react'
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'

interface BlockchainTransactionModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (txId: string, blockchainHash: string) => void
}

export default function BlockchainTransactionModal({
  isOpen,
  onClose,
  onSuccess
}: BlockchainTransactionModalProps) {
  const [step, setStep] = useState<'form' | 'processing' | 'success' | 'error'>('form')
  const [loading, setLoading] = useState(false)
  const [transactionId, setTransactionId] = useState('')
  const [blockchainHash, setBlockchainHash] = useState('')
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    sender_id: 'CENTRAL-001',
    sender_dept: 'Central Government (Delhi)',
    receiver_id: 'STATE-MH-001',
    receiver_dept: 'Maharashtra State Government',
    amount: '1000000',
    fees: '50000'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setStep('processing')

    try {
      const response = await fetch('http://localhost:8000/api/v1/transactions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_id: formData.sender_id,
          sender_dept: formData.sender_dept,
          receiver_id: formData.receiver_id,
          receiver_dept: formData.receiver_dept,
          amount: parseFloat(formData.amount),
          fees: parseFloat(formData.fees)
        })
      })

      const data = await response.json()

      if (data.success) {
        setTransactionId(data.transaction_id)
        setBlockchainHash(data.transaction.blockchain_tx_hash || data.transaction.sender_hash)
        setStep('success')
        
        if (onSuccess) {
          onSuccess(data.transaction_id, blockchainHash)
        }
      } else {
        setError(data.error || 'Failed to create transaction')
        setStep('error')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setStep('error')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#000080] to-[#040466] px-8 py-6 text-white">
          <h3 className="font-extrabold text-2xl">Fund Transfer to Blockchain</h3>
          <p className="text-sm text-blue-200 mt-1">
            {step === 'form' && 'Create a transaction that will be recorded on blockchain'}
            {step === 'processing' && 'Recording transaction on blockchain...'}
            {step === 'success' && 'Transaction successfully recorded!'}
            {step === 'error' && 'Error recording transaction'}
          </p>
        </div>

        {/* Content */}
        <div className="p-8">
          {step === 'form' && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">
                    Sender ID
                  </label>
                  <input
                    type="text"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:outline-none focus:border-[#000080] focus:ring-2 focus:ring-[#000080]/20"
                    value={formData.sender_id}
                    onChange={(e) => setFormData({...formData, sender_id: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">
                    Sender Department
                  </label>
                  <input
                    type="text"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:outline-none focus:border-[#000080] focus:ring-2 focus:ring-[#000080]/20"
                    value={formData.sender_dept}
                    onChange={(e) => setFormData({...formData, sender_dept: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">
                    Receiver ID
                  </label>
                  <input
                    type="text"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:outline-none focus:border-[#000080] focus:ring-2 focus:ring-[#000080]/20"
                    value={formData.receiver_id}
                    onChange={(e) => setFormData({...formData, receiver_id: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">
                    Receiver Department
                  </label>
                  <input
                    type="text"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:outline-none focus:border-[#000080] focus:ring-2 focus:ring-[#000080]/20"
                    value={formData.receiver_dept}
                    onChange={(e) => setFormData({...formData, receiver_dept: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:outline-none focus:border-[#000080] focus:ring-2 focus:ring-[#000080]/20"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">
                    Fees (₹)
                  </label>
                  <input
                    type="number"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:outline-none focus:border-[#000080] focus:ring-2 focus:ring-[#000080]/20"
                    value={formData.fees}
                    onChange={(e) => setFormData({...formData, fees: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl border border-gray-200 font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl bg-[#000080] text-white font-semibold hover:bg-[#040466] disabled:opacity-50 flex items-center gap-2 transition-colors"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Record on Blockchain
                </button>
              </div>
            </form>
          )}

          {step === 'processing' && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="w-12 h-12 animate-spin text-[#000080]" />
              <p className="text-lg font-semibold text-gray-700">Recording transaction...</p>
              <p className="text-sm text-gray-500">This may take a few moments</p>
            </div>
          )}

          {step === 'success' && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <CheckCircle2 className="w-16 h-16 text-green-500" />
              <p className="text-xl font-bold text-gray-800">Transaction Recorded!</p>
              
              <div className="w-full bg-green-50 border border-green-200 rounded-xl p-4 my-4 space-y-2">
                <p className="text-sm font-semibold text-gray-700">Transaction ID:</p>
                <p className="text-xs font-mono text-green-600 break-all">{transactionId}</p>
                
                <p className="text-sm font-semibold text-gray-700 pt-2">Blockchain Hash:</p>
                <p className="text-xs font-mono text-green-600 break-all">{blockchainHash}</p>
              </div>

              <p className="text-sm text-gray-600 text-center">
                Check on <a href={`https://amoy.polygonscan.com/tx/${blockchainHash}`} target="_blank" rel="noopener noreferrer" className="text-[#000080] underline">Polygon Explorer</a>
              </p>

              <button
                onClick={onClose}
                className="px-8 py-2.5 rounded-xl bg-[#000080] text-white font-semibold hover:bg-[#040466] transition-colors mt-4"
              >
                Close
              </button>
            </div>
          )}

          {step === 'error' && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <AlertCircle className="w-16 h-16 text-red-500" />
              <p className="text-xl font-bold text-gray-800">Error Recording Transaction</p>
              
              <div className="w-full bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-sm text-red-700">{error}</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('form')}
                  className="px-6 py-2.5 rounded-xl border border-gray-200 font-semibold hover:bg-gray-50"
                >
                  Try Again
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
