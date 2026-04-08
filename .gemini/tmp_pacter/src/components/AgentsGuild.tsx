'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send } from 'lucide-react'
import { HumanMessageText } from "@/components/ui/message"
import { EndpointsContext } from '@/app/agent'
import { useActions } from '@/ai/client'
import ConnectButton from './ui/walletButton'
import Image from 'next/image'
import { useAccount } from 'wagmi'
import PreBuiltTemplates from './ui/preBuiltTemplates';
import PortfolioWallet from './ui/portfolioWallet';
import Navbar from './layout/Navbar';

export function AgentsGuildInterface() {
  const { address, isConnected } = useAccount()
  const actions = useActions<typeof EndpointsContext>();
  const [input, setInput] = useState("")
  const [history, setHistory] = useState<[role: string, content: string][]>([
    ["human", "Hello!"],
    ["ai", "Welcome to Pakt! How can I assist you today?"]
  ]);
  const [elements, setElements] = useState<JSX.Element[]>([]);

  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [elements]); // This will trigger whenever elements change

  const handleSend = async () => {
    if (!isConnected) {
      // Optionally, you can show a message to the user here
      console.log("Please connect your wallet to chat");
      return;
    }

    const currentInput = input;
    const newElements = [...elements];
    
    const humanMessageRef = React.createRef<HTMLDivElement>();
    const humanKey = `human-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    newElements.push(
      <div className="flex flex-col items-end w-full gap-1 mt-auto" key={humanKey} ref={humanMessageRef}>
        <HumanMessageText content={currentInput} />
      </div>
    );
    
    setElements(newElements);
    setInput("");

    // Update history with the new human message
    const updatedHistory: [role: string, content: string][] = [...history, ["human", currentInput]];
    setHistory(updatedHistory);

    // Scroll to the human message
    setTimeout(() => {
      humanMessageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);

    const element = await actions.agent({
      chat_history: updatedHistory,
      input: currentInput
    });

    const aiMessageRef = React.createRef<HTMLDivElement>();
    const aiKey = `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setElements(prevElements => [
      ...prevElements,
      <div className="flex flex-col gap-1 w-full max-w-fit mr-auto" key={aiKey} ref={aiMessageRef}>
        {element.ui}
      </div>
    ]);

    // Update history with the actual AI response content
    const aiResponse = element.responseContent || "AI response received";
    setHistory(prevHistory => [...prevHistory, ["ai", aiResponse]]);

    // Scroll to show the top of the AI message
    setTimeout(() => {
      aiMessageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 2000);
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-[#1a2332] via-[#2d3748] to-[#1a202c] text-white font-mono">
      <Navbar />
      
      <div className="flex-1 flex p-8 gap-6">
        <div className="w-96 flex-shrink-0">
          <PortfolioWallet />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-4xl bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
          <ScrollArea ref={scrollAreaRef} className="h-[500px]">
            {elements.length > 0 ? (
              <div className="flex flex-col w-full gap-4 p-6">{elements}</div>
            ) : isConnected ? (
              <div className="flex h-full items-center justify-center">
                <PreBuiltTemplates />
              </div>
            ) : (
              <div className="flex h-full items-center justify-center p-8">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-2xl text-center max-w-md">
                  <div className="mb-6">
                    <div className="w-16 h-16 bg-gradient-to-r from-[#4299e1] to-[#3182ce] rounded-full mx-auto mb-4 flex items-center justify-center">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Connect Your Wallet</h3>
                    <p className="text-gray-300 text-sm leading-relaxed">Please connect your wallet to start chatting with Pakt and access all features.</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <p className="text-xs text-gray-400 mb-2">Supported Wallets</p>
                    <div className="flex justify-center space-x-2">
                      <div className="bg-white/10 rounded-lg px-3 py-1 text-xs text-gray-300">MetaMask</div>
                      <div className="bg-white/10 rounded-lg px-3 py-1 text-xs text-gray-300">WalletConnect</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </ScrollArea>
          
          <div className="p-6 border-t border-white/20 bg-white/5">
            <div className="flex space-x-4">
              <Input
                placeholder={
                  isConnected
                    ? "Describe your autonomous contract or ask a question..."
                    : "Connect wallet to chat"
                }
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) =>
                  e.key === "Enter" && isConnected && handleSend()
                }
                className="bg-white/10 text-white border-white/30 rounded-xl flex-grow focus:border-[#ffd700] focus:ring-2 focus:ring-[#ffd700]/50 transition-all placeholder-gray-400"
                disabled={!isConnected}
              />
              <Button
                onClick={handleSend}
                className={`bg-gradient-to-r from-[#4299e1] to-[#3182ce] text-white border-0 rounded-xl px-6 py-3 text-sm font-semibold hover:from-[#ffd700] hover:to-[#f6ad55] hover:text-black transition-all duration-300 flex items-center space-x-2 shadow-lg ${
                  !isConnected && "opacity-50 cursor-not-allowed"
                }`}
                disabled={!isConnected}
              >
                <Send className="w-4 h-4" />
                <span>Send</span>
              </Button>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}