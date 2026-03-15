import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { FaStore, FaUser, FaBars, FaTimes } from 'react-icons/fa';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <header className="fixed w-full top-0 z-50 bg-black/40 backdrop-blur-md border-b border-white/10 shadow-lg">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500">
          Strike<span className="text-white">Biller</span>
        </Link>

        <nav className="hidden md:flex space-x-8 items-center font-medium">
          <Link
            href="/subscriber"
            className="group text-gray-400 hover:text-white flex items-center space-x-2 transition-colors duration-300"
          >
            <FaUser className="text-gray-500 group-hover:text-blue-400 transition-colors duration-300" />
            <span>Subscriber Portal</span>
          </Link>
          <Link
            href="/merchant"
            className="group text-gray-400 hover:text-white flex items-center space-x-2 transition-colors duration-300"
          >
            <FaStore className="text-gray-500 group-hover:text-purple-400 transition-colors duration-300" />
            <span>Merchant Portal</span>
          </Link>
        </nav>

        {isMounted && (
          <div className="hidden md:inline-block">
            <WalletMultiButton
              className="!bg-blue-600/80 hover:!bg-blue-600 backdrop-blur-sm !border !border-blue-400/30 !rounded-lg transition-all"
            />
          </div>
        )}

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden text-gray-300 focus:outline-none"
        >
          {isOpen ? (
            <FaTimes className="w-6 h-6" />
          ) : (
            <FaBars className="w-6 h-6" />
          )}
        </button>
      </div>

      {isOpen && (
        <nav className="md:hidden bg-black/60 backdrop-blur-lg border-b border-white/10 py-4 shadow-xl">
          <div className="container mx-auto px-6 space-y-4 flex flex-col">
            <Link
              href="/subscriber"
              onClick={() => setIsOpen(false)}
              className="group text-gray-400 hover:text-white flex items-center space-x-3 transition-colors duration-300"
            >
              <FaUser className="text-gray-500 group-hover:text-blue-400 transition-colors" />
              <span>Subscriber Portal</span>
            </Link>
            <Link
              href="/merchant"
              onClick={() => setIsOpen(false)}
              className="group text-gray-400 hover:text-white flex items-center space-x-3 transition-colors duration-300"
            >
              <FaStore className="text-gray-500 group-hover:text-purple-400 transition-colors" />
              <span>Merchant Portal</span>
            </Link>
            <div className="pt-2">
              {isMounted && (
                <WalletMultiButton className="!bg-blue-600/80 hover:!bg-blue-600 backdrop-blur-sm !border !border-blue-400/30 !w-full !justify-center !rounded-lg" />
              )}
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}