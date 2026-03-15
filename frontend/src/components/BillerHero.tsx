import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

const BillerHero = () => {
  return (
    <section className="text-white py-20 px-6 md:px-12 relative">
      <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] -translate-y-1/2 pointer-events-none" />
      
      <div className="container mx-auto text-center md:text-left pt-10 relative z-10">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-10 md:mb-0">
            <h1 className="text-4xl md:text-6xl font-bold leading-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 drop-shadow-sm">
              Decentralized Subscriptions, Secured by Escrow.
            </h1>
            <p className="mt-4 text-lg md:text-xl text-gray-300/90 font-light">
              StrikeBiller is a trustless billing engine on Solana. Lock your funds securely, pay only for the time you use, and pause your subscription anytime.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center md:items-start space-y-4 sm:space-y-0 sm:space-x-4">
              <Link
                href="/subscriber"
                className="bg-blue-600/80 backdrop-blur-md border border-blue-400/30 text-white hover:bg-blue-500 font-semibold py-3 px-6 rounded-lg shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] transition-all duration-300 w-full sm:w-auto text-center"
              >
                Launch Subscriber App
              </Link>
              <Link
                href="/merchant"
                className="bg-purple-600/80 backdrop-blur-md border border-purple-400/30 text-white hover:bg-purple-500 font-semibold py-3 px-6 rounded-lg shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] transition-all duration-300 w-full sm:w-auto text-center"
              >
                Merchant Dashboard
              </Link>
            </div>
          </div>
          <div className="md:w-1/2 md:pl-10">
            <Image
              src="https://plus.unsplash.com/premium_photo-1733342554594-102b8e2d0623?q=80&w=1431&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              alt="Web3 Escrow Illustration"
              width={576}
              height={384}
              className="w-full rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.5)] h-96 object-cover border border-white/10"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

export default BillerHero