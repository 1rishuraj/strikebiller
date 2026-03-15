import React, { useState } from 'react'
import { FaTimes } from 'react-icons/fa'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import { RootState, SubscriptionPlan, Subscription } from '@/utils/interfaces'
import { setTopUpModal } from '@/redux/Global/Slices'
import { useBillerProgram, topUpAndResume, addFundsToVault } from '@/services/blockchain'
import { useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'

const FundVaultModal = ({
  planPubKey,
  actionType,
  availablePlans,
  subscriptions,
  onSuccess
}: {
  planPubKey: string
  actionType: 'topup' | 'add'
  availablePlans: SubscriptionPlan[]
  subscriptions: Subscription[]
  onSuccess: () => Promise<void>
}) => {
  const [amount, setAmount] = useState('')
  const { topUpModal } = useSelector((states: RootState) => states.globalStates)
  const dispatch = useDispatch()
  const { publicKey } = useWallet()
  const { program } = useBillerProgram()

  const targetPlan = availablePlans.find((p) => p.publicKey === planPubKey)
  const targetSub = subscriptions.find((s) => s.plan === planPubKey)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!program || !publicKey || !targetPlan || !targetSub) return

    const depositAmount = Number(amount)
    
    if (depositAmount < targetPlan.price) {
      toast.error(`Minimum amount is ${targetPlan.price} USDC`)
      return
    }

    await toast.promise(
      new Promise<void>(async (resolve, reject) => {
        try {
          if (actionType === 'topup') {
            const tx = await topUpAndResume(
              program,
              publicKey,
              new PublicKey(targetPlan.merchant),
              targetPlan.planId,
              depositAmount
            )
            resolve(tx as any)
          } else {
            const tx = await addFundsToVault(
              program,
              publicKey,
              new PublicKey(targetSub.vault), // Grab the vault 
              depositAmount
            )
            resolve(tx as any)
          }

          setAmount('')
          await onSuccess() 
          dispatch(setTopUpModal('scale-0')) // Close the modal
        } catch (error: any) {
          reject(error)
        }
      }),
      {
        pending: actionType === 'topup' ? 'Bundling Top Up & Resume...' : 'Depositing Funds...',
        success: actionType === 'topup' ? 'Account Reactivated! 🚀' : 'Vault Funded Successfully! 💰',
        error: 'Transaction Failed',
      }
    )
  }

  if (!targetPlan) return null;

  return (
    <div
      className={`fixed top-0 left-0 w-screen h-screen flex items-center justify-center
      bg-black bg-opacity-70 transform z-[3000] transition-transform duration-300 ${topUpModal}`}
    >
      <div className="bg-gray-800 border border-gray-700 shadow-2xl rounded-2xl w-11/12 md:w-1/3 p-8 text-white relative">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="flex flex-row justify-between items-center border-b border-gray-700 pb-4">
            <h3 className="text-xl font-bold text-blue-400">
              {actionType === 'topup' ? 'Top Up & Resume' : 'Add Funds to Vault'}
            </h3>
            <button
              type="button"
              className="text-gray-400 hover:text-white transition-colors"
              onClick={() => dispatch(setTopUpModal('scale-0'))}
            >
              <FaTimes size={20} />
            </button>
          </div>

          <div>
            <p className="text-sm text-gray-400 mb-4">
              The minimum deposit for this plan is <strong className="text-white">{targetPlan.price} USDC</strong>.
            </p>
            <label className="block text-gray-300 mb-2 font-medium">Deposit Amount (USDC)</label>
            <input
              type="number"
              placeholder={`Min ${targetPlan.price}`}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full p-4 bg-gray-900 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
              min={targetPlan.price}
              step="any"
              required
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={!amount || Number(amount) < targetPlan.price}
              className={`w-full font-bold py-3 px-4 rounded-xl shadow-lg transition-all
                ${!amount || Number(amount) < targetPlan.price 
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
            >
              {actionType === 'topup' ? 'Confirm & Resume' : 'Deposit Funds'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default FundVaultModal