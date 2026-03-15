'use client'

import BillerHero from '@/components/BillerHero'
import Link from 'next/link'

export default function Page() {
  return (
    <div className="w-full text-white">
      <BillerHero />
      
      <div className="container mx-auto p-6 py-20 relative z-10">
        <h2 className="text-3xl md:text-4xl font-bold mb-14 text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
          How StrikeBiller Works
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="bg-white/5 backdrop-blur-lg p-8 rounded-2xl border border-white/10 text-center shadow-2xl hover:-translate-y-2 hover:bg-white/10 hover:border-purple-500/50 transition-all duration-300">
            <div className="text-5xl mb-6 drop-shadow-lg">🏦</div>
            <h3 className="text-xl font-bold mb-3 text-white">Trustless Vaults</h3>
            <p className="text-gray-400 font-light leading-relaxed">
              Funds are locked in a PDA escrow. Merchants cannot run away with your money, and they only get paid after the service is actively rendered.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-lg p-8 rounded-2xl border border-white/10 text-center shadow-2xl hover:-translate-y-2 hover:bg-white/10 hover:border-blue-500/50 transition-all duration-300">
            <div className="text-5xl mb-6 drop-shadow-lg">⚙️</div>
            <h3 className="text-xl font-bold mb-3 text-white">Lazy State Machine</h3>
            <p className="text-gray-400 font-light leading-relaxed">
              Powered by off-chain Cranker bots. If your vault runs empty, the contract gracefully executes a 3-strike system before hard-pausing access.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-lg p-8 rounded-2xl border border-white/10 text-center shadow-2xl hover:-translate-y-2 hover:bg-white/10 hover:border-purple-500/50 transition-all duration-300">
            <div className="text-5xl mb-6 drop-shadow-lg">🏖️</div>
            <h3 className="text-xl font-bold mb-3 text-white">Vacation Mode</h3>
            <p className="text-gray-400 font-light leading-relaxed">
              Going away? Subscribers can manually soft-pause their subscription at any time to freeze the billing clock and save their remaining runway.
            </p>
          </div>
        </div>

        <div className="text-center mt-20">
          <Link
            href="/merchant"
            className="inline-block bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold py-4 px-10 rounded-xl shadow-[0_0_30px_rgba(147,51,234,0.3)] transition-all text-lg border border-white/10"
          >
            Deploy Your First Plan
          </Link>
        </div>
      </div>
    </div>
  )
}