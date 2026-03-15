'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { PublicKey } from "@solana/web3.js"
import { useDispatch, useSelector } from 'react-redux'
import { RootState, SubscriptionPlan } from '@/utils/interfaces'
import { setUserSubscriptions } from '@/redux/Global/Slices'
import { setTopUpModal } from '@/redux/Global/Slices'
import FundVaultModal from '@/components/FundVaultModal' 
import {
  useBillerProgram,
  subscribeToPlan,
  toggleSubscription,
  cancelSubscription,
  fetchUserSubscriptions,
} from '@/services/blockchain'

export default function SubscriberPage() {
  const { program } = useBillerProgram()
  const { publicKey } = useWallet()
  const dispatch = useDispatch()
  const [modalAction, setModalAction] = useState<'topup' | 'add'>('add')
  const [selectedPlanPubKey, setSelectedPlanPubKey] = useState<string | null>(null)
  const subscriptions = useSelector((state: RootState) => state.globalStates.userSubscriptions)

  // Local state to hold all global plans to display as a storefront
  const [availablePlans, setAvailablePlans] = useState<SubscriptionPlan[]>([])

  // Fetch plans and subscriptions on load
  const loadData = async () => {
    if (program && publicKey) {
      const fetchedSubs = await fetchUserSubscriptions(program, publicKey)
      dispatch(setUserSubscriptions(fetchedSubs))

      const connection = program.provider.connection;

      const subsWithBalances = await Promise.all(fetchedSubs.map(async (sub) => {
        try {
          const balance = await connection.getTokenAccountBalance(new PublicKey(sub.vault));
          return { ...sub, vaultBalance: balance.value.uiAmount || 0 };
        } catch (e) {
          return { ...sub, vaultBalance: 0 };
        }
      }));

      dispatch(setUserSubscriptions(subsWithBalances));
      const allPlansRaw = await program.account.subscriptionPlan.all()
      const formattedPlans: SubscriptionPlan[] = allPlansRaw.map(p => ({
        publicKey: p.publicKey.toBase58(),
        merchant: p.account.merchant.toBase58(),
        planId: p.account.planId,
        price: p.account.price.toNumber() / 1e6,
        billingCycleSeconds: p.account.billingCycleSeconds.toNumber(),
        isActive: p.account.isActive,
        createdAt: p.account.createdAt.toNumber() * 1000,
        mint: p.account.mint.toBase58(),
      }))
      console.log(formattedPlans)
      setAvailablePlans(formattedPlans.filter(p => p.isActive))
    }
  }

  useEffect(() => {
    loadData()
  }, [program, publicKey])

  const handleSubscribe = async (merchantPubkeyStr: string, planId: string, price: number) => {
    if (!publicKey || !program) return toast.warn('Please connect wallet')

    await toast.promise(
      new Promise<void>(async (resolve, reject) => {
        try {
          const merchPubkey = new PublicKey(merchantPubkeyStr)
          const depositAmount = price * 3
          const tx = await subscribeToPlan(program, publicKey, merchPubkey, planId, depositAmount)

          await loadData() 
          resolve(tx as any)
        } catch (error: any) { 
          reject(error); 
        }
      }),
      { pending: 'Approving Subscription...', success: 'Vault Funded & Subscribed 🏦', error: {
          render({ data }: any) {
            return data?.message || 'Transaction Failed 🤯';
          }
        }
      }
    )
  }

  const handleToggle = async (planPubKey: string) => {
    if (!publicKey || !program) return toast.warn('Please connect wallet')

   
    const targetPlan = availablePlans.find(p => p.publicKey === planPubKey)
    if (!targetPlan) return toast.error("Plan details not found!")

    await toast.promise(
      new Promise<void>(async (resolve, reject) => {
        try {
          const tx = await toggleSubscription(program, publicKey, new PublicKey(targetPlan.merchant), targetPlan.planId, publicKey)
          await loadData()
          resolve(tx as any)
        } catch (error) {
          reject(error)
        }
      }),
      { pending: 'Toggling State...', success: 'Vacation Mode Updated 🏖️', error: 'Failed to toggle' }
    )
  }

  const handleCancel = async (planPubKey: string) => {
    if (!publicKey || !program) return toast.warn('Please connect wallet')

    const targetPlan = availablePlans.find(p => p.publicKey === planPubKey)
    if (!targetPlan) return toast.error("Plan details not found!")

    await toast.promise(
      new Promise<void>(async (resolve, reject) => {
        try {
          const tx = await cancelSubscription(program, publicKey, new PublicKey(targetPlan.merchant), targetPlan.planId)
          await loadData()
          resolve(tx as any)
        } catch (error) {
          reject(error)
        }
      }),
      { pending: 'Canceling & Refunding...', success: 'Subscription Canceled. Funds Refunded 💸', error: 'Failed to cancel' }
    )
  }

  const handleTopUpAndResume = (planPubKey: string) => {
    setSelectedPlanPubKey(planPubKey)
    setModalAction('topup')
    dispatch(setTopUpModal('scale-100')) // Opens the modal
  }

  const handleAddFunds = (planPubKey: string) => {
    setSelectedPlanPubKey(planPubKey)
    setModalAction('add')
    dispatch(setTopUpModal('scale-100')) // Opens the modal
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl relative z-10 text-white">
      <h1 className="text-4xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
        Subscriber Portal
      </h1>
      {/* 🌟 HACKATHON FAUCET NOTICE 🌟 */}
      <div className="mb-8 bg-blue-900/20 border border-blue-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between shadow-[0_0_15px_rgba(37,99,235,0.15)]">
        <div className="mb-4 sm:mb-0">
          <h3 className="text-blue-400 font-bold flex items-center gap-2">
            <span className="text-xl">💧</span> Devnet Testing Notice
          </h3>
          <p className="text-sm text-gray-300 mt-1">
            This app requires a specific Devnet USDC token. If your transactions are failing, you need to fund your wallet.
          </p>
        </div>
        <a 
          href="https://spl-token-faucet.com/?token-name=USDC-Dev" 
          target="_blank" 
          rel="noopener noreferrer"
          className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold py-2 px-6 rounded-lg transition-all shadow-lg whitespace-nowrap"
        >
          Get Devnet USDC
        </a>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left: Storefront (List of Available Plans) */}
        <div className="bg-white/5 backdrop-blur-lg p-8 rounded-2xl border border-white/10 shadow-2xl h-fit">
          <h2 className="text-2xl font-semibold mb-6">Available Plans</h2>

          {availablePlans.length === 0 ? (
            <p className="text-gray-400">No active plans found on the network.</p>
          ) : (
            <div className="space-y-4">
              {availablePlans.map((plan) => (
                <div key={plan.publicKey} className="p-5 bg-black/40 border border-white/10 rounded-xl hover:border-blue-500/50 transition-colors">
                  <h3 className="font-bold text-xl text-blue-400 mb-1">{plan.planId}</h3>
                  <p className="text-xs text-gray-500 mb-3 truncate">By: {plan.merchant}</p>

                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-semibold text-white">{plan.price} USDC <span className="text-gray-400 font-normal">/ {plan.billingCycleSeconds}s</span></p>
                    </div>
                    {subscriptions.find((x) => x.plan === plan.publicKey) ? (
                      <button
                        className="bg-green-600 hover:bg-green-700 text-white text-sm font-bold py-2 px-4 rounded-lg shadow-lg transition-all cursor-not-allowed"
                        disabled
                      >
                        Subscribed
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSubscribe(plan.merchant, plan.planId, plan.price)}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2 px-4 rounded-lg shadow-lg transition-all"
                      >
                        Subscribe
                      </button>
                    )}

                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Manage Subscriptions via Redux */}
        <div className="bg-white/5 backdrop-blur-lg p-8 rounded-2xl border border-white/10 shadow-2xl h-fit">
          <h2 className="text-xl font-semibold mb-6">Your Escrow Vaults</h2>
          {subscriptions.length === 0 ? (
            <p className="text-gray-400">You have no active subscriptions.</p>
          ) : (
            <div className="space-y-6">
              {subscriptions.map((sub) => {
                const planDetails = availablePlans.find(p => p.publicKey === sub.plan)
                const planName = planDetails ? planDetails.planId : "Unknown Plan"

                return (
                  <div key={sub.publicKey} className="p-5 bg-black/40 border border-white/10 rounded-xl relative overflow-hidden hover:border-purple-500/50 transition-colors">
                    {/* Status Indicator */}
                    <div className={`absolute top-0 right-0 px-3 py-1 rounded-bl-lg text-xs font-bold ${sub.isActive ? 'bg-green-600' : 'bg-yellow-600'}`}>
                      {sub.isActive ? "ACTIVE" : "PAUSED"}
                    </div>

                    <h3 className="font-bold text-lg text-white mb-1">{planName}</h3>
                    <p className="text-xs text-gray-500 mb-3 font-mono">Vault: {sub.vault.slice(0, 12)}...</p>

                    <div className="grid grid-cols-2 gap-2 mb-4 text-sm bg-black/50 p-3 rounded-lg border border-white/5">
                      {/* 🌟 Add the Vault Balance here! */}
                      <p className="text-gray-400">Vault Runway: <span className="text-green-400 font-bold block">{sub.vaultBalance} USDC</span></p>
                      <p className="text-gray-400">Total Paid: <span className="text-white block">{sub.totalPaid} USDC</span></p>
                      <p className="text-gray-400">Strikes: <span className="text-red-400 block">{sub.failedAttempts}/3</span></p>
                      <p className="text-gray-400">Next Bill: <span className="text-white block">{new Date(sub.nextBillingAt).toLocaleTimeString()}</span></p>
                    </div>

                    <div className="flex flex-col space-y-2">
                      {sub.failedAttempts >= 3 ? (
                        <button
                          onClick={() => handleTopUpAndResume(sub.plan)}
                          className="w-full bg-blue-600/80 hover:bg-blue-600 text-white text-sm font-bold py-2 rounded-lg transition-all"
                        >
                          Top Up & Resume
                        </button>
                      ) : (
                        <>
                          {/* 🌟 New proactive funding button */}
                          {/* Change this button inside the mapped cards */}
                          <button
                            onClick={() => handleAddFunds(sub.plan)} // <--- Changed from sub.vault to sub.plan
                            className="w-full bg-blue-600/80 hover:bg-blue-600 text-white text-sm font-bold py-2 rounded-lg transition-all border border-blue-500/30"
                          >
                            + Add Funds to Vault
                          </button>

                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleToggle(sub.plan)}
                              className="flex-1 bg-yellow-600/80 hover:bg-yellow-600 text-white text-sm font-bold py-2 rounded-lg transition-all"
                            >
                              {sub.isActive ? "Pause" : "Resume"}
                            </button>
                            <button
                              onClick={() => handleCancel(sub.plan)}
                              className="flex-1 bg-red-600/80 hover:bg-red-600 text-white text-sm font-bold py-2 rounded-lg transition-all"
                            >
                              Refund
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
      {selectedPlanPubKey && (
          <FundVaultModal
            planPubKey={selectedPlanPubKey}
            actionType={modalAction}
            availablePlans={availablePlans}
            subscriptions={subscriptions}
            onSuccess={loadData}
          />
        )}
    </div>
  )
}