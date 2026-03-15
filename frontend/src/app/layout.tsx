'use client'

import './globals.css'
import Header from '@/components/Header'
import 'react-toastify/dist/ReactToastify.css'
import { ToastContainer } from 'react-toastify'
import { ReactQueryProvider } from './react-query-provider'
import AppWalletProvider from '@/components/AppWalletProvider'
import { store } from '@/redux/store'
import { Provider } from 'react-redux'

const metadata = {
  title: 'StrikeBiller',
  description: 'Decentralized Subscription Billing on Solana',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gray-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-gray-950 to-black text-white min-h-screen">
        <Provider store={store}>
          <ReactQueryProvider>
            <AppWalletProvider>
              <Header />
              <main className="max-w-6xl mx-auto min-h-screen">
                <div className="h-24" />
                {children}
                <div className="h-24" />
              </main>

              <ToastContainer
                position="bottom-center"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="dark"
              />
            </AppWalletProvider>
          </ReactQueryProvider>
        </Provider>
      </body>
    </html>
  )
}