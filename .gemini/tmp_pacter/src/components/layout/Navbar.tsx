"use client";

import React from 'react';
import ConnectButton from '../ui/walletButton';
import Image from 'next/image';

export default function Navbar() {
  return (
    <nav className="w-full bg-gradient-to-r from-[#4299e1] via-[#3182ce] to-[#2b6cb0] px-6 py-4 shadow-lg border-b border-gray-600">
      <div className="flex items-center max-w-8xl mx-auto">
        {/* Logo/Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center p-1 shadow-lg">
            <Image 
              src="/logo.png" 
              alt="Pakt Logo" 
              width={32} 
              height={32} 
              className="rounded-lg object-contain"
            />
          </div>
          <span className="text-white font-mono text-xl font-semibold">
            Pakt
          </span>
        </div>

        {/* Navigation Links - Centered */}
        <div className="flex-1 flex justify-center">
          <div className="hidden md:flex items-center space-x-6">
            <a 
              href="/" 
              className="text-white/80 hover:text-white transition-colors font-mono"
            >
              Home
            </a>
            <a 
              href="/create" 
              className="text-white font-mono bg-white/20 px-4 py-2 rounded-lg hover:bg-white/30 transition-colors"
            >
              Create Contract
            </a>
            <a 
              href="/contracts" 
              className="text-white/80 hover:text-white transition-colors font-mono"
            >
              My Contracts
            </a>
          </div>
        </div>

        {/* Wallet Connect Button - Right Edge */}
        <div className="flex items-center">
          <ConnectButton />
        </div>
      </div>
    </nav>
  );
}