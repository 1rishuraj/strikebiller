'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { PublicKey } from "@solana/web3.js"
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/utils/interfaces' // Adjust path as needed
import { setMerchantPlans } from '@/redux/Global/Slices' // Adjust path as needed

import { 
  useBillerProgram, 
  initializePlan, 
  fetchMerchantPlans 
} from '@/services/blockchain'

export default function MerchantPage() {
  const { program } = useBillerProgram()
  const { publicKey } = useWallet()
  const dispatch = useDispatch()
  
  const plans = useSelector((state: RootState) => state.globalStates.merchantPlans)

  const [form, setForm] = useState({
    planId: 'Pro',
    price: '1', 
    cycleSeconds: '30',
  })

  useEffect(() => {
    const loadPlans = async () => {
      if (program && publicKey) {
        const fetchedPlans = await fetchMerchantPlans(program, publicKey)
        console.log(fetchedPlans)
        dispatch(setMerchantPlans(fetchedPlans))
      }
    }
    loadPlans()
  }, [program, publicKey, dispatch])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!publicKey || !program) return toast.warn('Please connect wallet')

    await toast.promise(
      new Promise<void>(async (resolve, reject) => {
        try {
          const { planId, price, cycleSeconds } = form
          
          const tx = await initializePlan(
            program, 
            publicKey, 
            planId, 
            Number(price), 
            Number(cycleSeconds)
          )
          
          const updatedPlans = await fetchMerchantPlans(program, publicKey)
          dispatch(setMerchantPlans(updatedPlans))
          
          resolve(tx as any)
        } catch (error) {
          console.error(error)
          reject(error)
        }
      }),
      {
        pending: 'Deploying Plan to Solana...',
        success: 'Plan Initialized Successfully 🚀',
        error: 'Failed to create plan 🤯',
      }
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl relative z-10 text-white">
      <h1 className="text-4xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
        Merchant Dashboard
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column: Create Form */}
        <div className="bg-white/5 backdrop-blur-lg p-8 rounded-2xl border border-white/10 shadow-2xl h-fit">
          <h2 className="text-2xl font-semibold mb-6">Create Subscription Plan</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-gray-400 mb-2">Plan Name (ID)</label>
              <input
                type="text"
                value={form.planId}
                onChange={(e) => setForm({ ...form, planId: e.target.value })}
                className="w-full p-3 bg-black/40 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-2">Price (USDC per cycle)</label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="w-full p-3 bg-black/40 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-2">Billing Cycle (Seconds)</label>
              <input
                type="number"
                value={form.cycleSeconds}
                onChange={(e) => setForm({ ...form, cycleSeconds: e.target.value })}
                className="w-full p-3 bg-black/40 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                required
              />
            </div>
            <button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold py-3 px-4 rounded-xl shadow-[0_0_20px_rgba(147,51,234,0.3)] transition-all">
              Deploy Plan
            </button>
          </form>
        </div>

        {/* Right Column: Active Plans */}
        <div className="bg-white/5 backdrop-blur-lg p-8 rounded-2xl border border-white/10 shadow-2xl">
          <h2 className="text-2xl font-semibold mb-6">Your Deployed Plans</h2>
          {plans.length === 0 ? (
            <p className="text-gray-400">No plans deployed yet.</p>
          ) : (
            <div className="space-y-4">
              {plans.map((p) => (
                <div key={p.publicKey} className="p-5 bg-black/40 border border-white/10 rounded-xl relative overflow-hidden">
                  <div className={`absolute top-0 right-0 px-3 py-1 rounded-bl-lg text-xs font-bold ${p.isActive ? 'bg-green-600' : 'bg-red-600'}`}>
                    {p.isActive ? "ACTIVE" : "INACTIVE"}
                  </div>

                  <h3 className="font-bold text-xl text-purple-400 mb-2">{p.planId}</h3>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-300">
                    <p>Price: <span className="font-semibold text-white">{p.price} USDC</span></p>
                    <p>Cycle: <span className="font-semibold text-white">{p.billingCycleSeconds}s</span></p>
                  </div>
                  <p className="text-xs text-gray-500 mt-4 font-mono truncate">
                    PDA: {p.publicKey}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}