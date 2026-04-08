"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { CreateChatProps, GraphState, CollectedContractData, VerificationProof } from '@/lib/types';
import { FLOW_METADATA } from '@/lib/flows';
import { HumanMessageText } from "@/components/ui/message";
import { EndpointsContext } from '@/app/agent';
import { useActions } from '@/ai/client';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { createContract } from '@/services/contractService';


export default function CreateChat({
  flowType,
  currentStage,
  setCurrentStage,
  onStageDataUpdate,
  onGraphStateUpdate
}: CreateChatProps) {

  const router = useRouter();
  const { address, isConnected } = useAccount();
  const actions = useActions<typeof EndpointsContext>();
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<[role: string, content: string][]>([]);
  const [elements, setElements] = useState<JSX.Element[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Graph state tracking
  const [graphState, setGraphState] = useState<GraphState>({});
  const [contractProgress, setContractProgress] = useState(0);
  const [stageValidationErrors, setStageValidationErrors] = useState<string[]>([]);
  const [walletAddressSent, setWalletAddressSent] = useState(false);

  // Contract generation state
  const [collectedData, setCollectedData] = useState<CollectedContractData | null>(null);
  const [isGeneratingContract, setIsGeneratingContract] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<{
    stage: string;
    message: string;
    percentage: number;
  } | null>(null);
  const [generatedContract, setGeneratedContract] = useState<{
    contractId: string;
    contractText: string;
    contractHash: string;
    verificationProof: VerificationProof | null;
  } | null>(null);
  const [contractError, setContractError] = useState<string | null>(null);

  const flowData = FLOW_METADATA[flowType];
  const currentStageName = flowData.stages[currentStage];

  // Initialize with welcome message and auto-scroll
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
    }
  }, [elements]);

  // Update frontend stage based on graph state changes
  useEffect(() => {
    if (graphState.currentFlowStage && graphState.stageIndex !== undefined) {
      // Sync frontend stage with graph stage
      if (graphState.stageIndex !== currentStage) {
        setCurrentStage(graphState.stageIndex);
      }

      // Update progress
      if (graphState.progress !== undefined) {
        setContractProgress(graphState.progress);
      }

      // Update stage data if available
      if (graphState.stageData && onStageDataUpdate) {
        onStageDataUpdate(graphState.stageData);
      }

      // Notify parent component of graph state changes
      if (onGraphStateUpdate && graphState.progress !== undefined) {
        onGraphStateUpdate(graphState, graphState.progress);
      }
    }
  }, [graphState, currentStage, setCurrentStage, onStageDataUpdate, onGraphStateUpdate]);

  // Show final contract success with link (simplified - no inference step)
  const showContractSuccess = useCallback((contractId: string) => {
    const contractLink = `${window.location.origin}/contract/${contractId}`;
    const successKey = `contract-complete-${Date.now()}`;

    setElements(prev => [
      ...prev,
      <div key={successKey} className="flex flex-col gap-1 w-full max-w-fit mr-auto">
        <div className="bg-slate-700/80 text-slate-100 px-3.5 py-2.5 rounded-lg border border-slate-600/30 max-w-[85%]">
          <div className="bg-emerald-500/20 border border-emerald-500/50 rounded-lg p-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">✓</span>
              <div>
                <h3 className="text-emerald-400 font-mono font-medium text-sm">
                  Contract Created Successfully!
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  Your contract is ready. Share the link with the freelancer to get started.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-lg p-3 mb-3">
            <div className="text-xs text-slate-400 mb-2">Contract Features:</div>
            <div className="space-y-1 text-xs font-mono">
              <div className="text-emerald-400">✓ Legal Contract (Indian Law)</div>
              <div className="text-emerald-400">✓ Escrow Protection</div>
              <div className="text-emerald-400">✓ Polygon Blockchain</div>
              <div className="text-emerald-400">✓ AI Verification</div>
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-lg p-3 mb-3">
            <div className="text-xs text-slate-400 mb-2">Your Contract Link:</div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={contractLink}
                readOnly
                className="flex-1 bg-slate-900/50 text-emerald-400 px-2 py-1.5 rounded text-xs font-mono border border-slate-600"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(contractLink);
                  alert('Link copied to clipboard!');
                }}
                className="px-3 py-1.5 bg-slate-600 hover:bg-slate-500 text-white rounded text-xs font-mono transition-colors"
              >
                Copy
              </button>
            </div>
            <a
              href={contractLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 text-xs hover:text-emerald-300 mt-2 inline-block underline"
            >
              Open contract in new tab →
            </a>
          </div>
        </div>
      </div>
    ]);
  }, []);

  // Contract generation handler
  const handleContractGeneration = useCallback(async (data: CollectedContractData) => {
    setIsGeneratingContract(true);
    setContractError(null);

    // Add loading message to chat
    const loadingKey = `loading-${Date.now()}`;
    setElements(prev => [
      ...prev,
      <div key={loadingKey} className="flex flex-col gap-1 w-full max-w-fit mr-auto">
        <ContractGenerationMessage progress={{
          stage: 'generating',
          message: 'Generating simple contract...',
          percentage: 25
        }} />
      </div>
    ]);

    try {
      // Step 1: Generate contract
      setGenerationProgress({
        stage: 'generating',
        message: 'Generating simple contract...',
        percentage: 25
      });

      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 2: Process
      setGenerationProgress({
        stage: 'processing',
        message: 'Processing contract data...',
        percentage: 50
      });

      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 3: Upload to storage
      setGenerationProgress({
        stage: 'uploading',
        message: 'Uploading to secure storage...',
        percentage: 75
      });

      // Call contract service (generates simple contract AND uploads to backend)
      const result = await createContract(data);

      if (result.success) {
        console.log('Contract created and uploaded successfully:', result.contractId);

        setGenerationProgress({
          stage: 'complete',
          message: 'Contract created and uploaded successfully!',
          percentage: 100
        });

        setGeneratedContract({
          contractId: result.contractId,
          contractText: result.contractText,
          contractHash: result.contractHash,
          verificationProof: result.verificationProof || null
        });

        // Verify contract was actually saved by fetching it
        try {
          const verifyResponse = await fetch(`/api/contracts?id=${result.contractId}`);
          if (!verifyResponse.ok) {
            throw new Error('Contract not found in backend after upload');
          }
          console.log('Contract verified in backend');
        } catch (verifyError) {
          console.error('Contract verification failed:', verifyError);
          throw new Error('Contract was not properly saved to backend');
        }

        // Remove loading message and show success with link directly
        setElements(prev => prev.slice(0, -1));

        // Show contract success with link (simplified flow - no inference step)
        showContractSuccess(result.contractId);
      } else {
        throw new Error(result.error || 'Contract generation failed');
      }
    } catch (error: any) {
      console.error('Contract generation error:', error);
      setContractError(error.message);

      // Remove loading message and add error message
      setElements(prev => prev.slice(0, -1));

      const errorKey = `error-${Date.now()}`;
      setElements(prev => [
        ...prev,
        <div key={errorKey} className="flex flex-col gap-1 w-full max-w-fit mr-auto">
          <ContractErrorMessage
            error={error.message}
            onRetry={() => handleContractGeneration(data)}
          />
        </div>
      ]);
    } finally {
      setIsGeneratingContract(false);
    }
  }, [showContractSuccess]);

  // Trigger contract generation when data collection is complete
  useEffect(() => {
    if (graphState.stage === 'completed' &&
      graphState.progress === 100 &&
      graphState.collectedData &&
      !isGeneratingContract &&
      !generatedContract) {

      console.log('Data collection complete! Starting inline contract generation...');
      setCollectedData(graphState.collectedData);
      handleContractGeneration(graphState.collectedData);
    }
  }, [graphState, isGeneratingContract, generatedContract, handleContractGeneration]);

  const handleSend = async () => {
    if (!isConnected) {
      console.log("Please connect your wallet to chat");
      return;
    }

    const currentInput = input;
    const newElements = [...elements];

    const humanMessageRef = React.createRef<HTMLDivElement>();
    const humanKey = `human-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
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

    // For the first message, include wallet address directly in the input
    let messageWithWallet = currentInput;
    if (!walletAddressSent && address) {
      messageWithWallet = `${currentInput} [My wallet address is: ${address}]`;
      setWalletAddressSent(true);
    }

    // Include wallet address in the agent call
    const element = await actions.agent({
      chat_history: updatedHistory,
      input: messageWithWallet,
      walletAddress: address || null
    });

    // Update graph state with the response
    if (element.graphState) {
      setGraphState(element.graphState);

      // Update individual state variables for easier access
      if (element.graphState.validationErrors) {
        setStageValidationErrors(element.graphState.validationErrors);
      }
    }

    const aiMessageRef = React.createRef<HTMLDivElement>();
    const aiKey = `ai-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
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

  const handleQuickAction = async (actionText: string) => {
    if (!isConnected) {
      console.log("Please connect your wallet to chat");
      return;
    }

    // Directly use the actionText instead of relying on state
    const newElements = [...elements];

    const humanMessageRef = React.createRef<HTMLDivElement>();
    const humanKey = `human-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    newElements.push(
      <div className="flex flex-col items-end w-full gap-1 mt-auto" key={humanKey} ref={humanMessageRef}>
        <HumanMessageText content={actionText} />
      </div>
    );

    setElements(newElements);
    setInput(""); // Clear input

    // Update history with the new human message
    const updatedHistory: [role: string, content: string][] = [...history, ["human", actionText]];
    setHistory(updatedHistory);

    // Scroll to the human message
    setTimeout(() => {
      humanMessageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);

    // For the first message, include wallet address directly in the input
    let messageWithWallet = actionText;
    if (!walletAddressSent && address) {
      messageWithWallet = `${actionText} [My wallet address is: ${address}]`;
      setWalletAddressSent(true);
    }

    // Include wallet address in the agent call
    const element = await actions.agent({
      chat_history: updatedHistory,
      input: messageWithWallet,
      walletAddress: address || null
    });

    // Update graph state with the response
    if (element.graphState) {
      setGraphState(element.graphState);

      // Update individual state variables for easier access
      if (element.graphState.validationErrors) {
        setStageValidationErrors(element.graphState.validationErrors);
      }
    }

    const aiMessageRef = React.createRef<HTMLDivElement>();
    const aiKey = `ai-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
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

  const getCurrentPrompt = () => {
    const prompts: Record<string, string> = {
      'Identity Selected': 'Please select your role to get started',
      'Project Details Entered': 'Tell me about your project requirements',
      'Deliverables Defined': 'Define the project deliverables and milestones',
      'Payment Terms Set': 'Set up payment terms and escrow details',
      'Review Contract': 'Review the generated contract draft',
      'Contract Created': 'Your contract is ready for signatures'
    };

    return prompts[currentStageName] || 'How can I help you with this step?';
  };

  // Message Components
  const ContractGenerationMessage = ({ progress }: { progress: { stage: string; message: string; percentage: number } }) => (
    <div className="bg-slate-700/80 text-slate-100 px-3.5 py-2.5 rounded-lg border border-slate-600/30 max-w-[85%]">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 border-4 border-slate-600 border-t-emerald-500 rounded-full animate-spin"></div>
        <div>
          <h3 className="text-sm font-mono font-medium">Creating Your Contract</h3>
          <p className="text-xs text-slate-400">{progress.message}</p>
        </div>
      </div>

      <div className="w-full bg-slate-600/50 rounded-full h-2 mb-2">
        <div
          className="bg-gradient-to-r from-emerald-500 to-teal-600 h-2 rounded-full transition-all duration-500"
          style={{ width: `${progress.percentage}%` }}
        />
      </div>

      <div className="space-y-1 text-xs font-mono">
        <div className={progress.percentage >= 25 ? 'text-emerald-400' : 'text-slate-400'}>
          {progress.percentage >= 25 ? '✓' : '⟳'} Generating legal contract...
        </div>
        <div className={progress.percentage >= 50 ? 'text-emerald-400' : 'text-slate-400'}>
          {progress.percentage >= 50 ? '✓' : '⟳'} Processing contract data...
        </div>
        <div className={progress.percentage >= 75 ? 'text-emerald-400' : 'text-slate-400'}>
          {progress.percentage >= 75 ? '✓' : '⟳'} Saving to backend...
        </div>
      </div>
    </div>
  );

  // ContractPreviewMessage removed - no longer needed with simplified flow

  const ContractErrorMessage = ({ error, onRetry }: { error: string; onRetry: () => void }) => (
    <div className="bg-slate-700/80 text-slate-100 px-3.5 py-2.5 rounded-lg border border-red-500/30 max-w-[85%]">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
          <span className="text-xl">⚠️</span>
        </div>
        <div>
          <h3 className="text-sm font-mono font-medium text-red-400">
            Contract Generation Failed
          </h3>
          <p className="text-xs text-slate-300 mt-1">{error}</p>
        </div>
      </div>

      <button
        onClick={onRetry}
        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-2 rounded-lg text-xs font-mono transition-colors"
      >
        Retry Generation
      </button>
    </div>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] bg-slate-800/40 rounded-xl backdrop-blur-sm border border-slate-600/50">
      {/* Current Prompt Card */}
      <div className="p-3.5 border-b border-slate-600/50 bg-gradient-to-r from-emerald-500/15 to-teal-600/15 flex-shrink-0">
        <div className="flex items-start space-x-2.5">
          <div className="w-5 h-5 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-mono">AI</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-white font-mono font-medium text-sm">
                Current Step: {currentStageName}
              </h3>
              <div className="flex items-center gap-2">
                {walletAddressSent && (
                  <span className="text-green-400 text-xs font-mono">
                    Address Sent ✓
                  </span>
                )}
                {contractProgress > 0 && (
                  <span className="text-emerald-400 text-xs font-mono">
                    {contractProgress.toFixed(0)}%
                  </span>
                )}
              </div>
            </div>
            <p className="text-slate-300 text-xs font-mono mb-2">
              {getCurrentPrompt()}
            </p>

            {/* Remove technical debug info and show user-friendly messages */}
            {stageValidationErrors.length > 0 && (
              <div className="text-xs font-mono text-amber-400 mt-1">
                Please provide additional information to continue
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages History */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5 min-h-0" ref={messagesEndRef}>
        {elements.length > 0 ? (
          <div className="flex flex-col w-full gap-4">{elements}</div>
        ) : isConnected ? (
          <div className="flex justify-start">
            <div className="bg-slate-700/80 text-slate-100 px-3.5 py-2.5 rounded-lg border border-slate-600/30 max-w-[85%]">
              <p className="text-xs font-mono leading-relaxed mb-2.5">
                Welcome to Pakt! I'm your AI assistant specialized in creating secure, legally-compliant smart contract escrow workflows.
                Pakt combines traditional legal contracts with blockchain technology to ensure transparent, automated, and trustworthy transactions between parties.

                I'll guide you through each step of creating your custom contract. Please tell me about your specific requirements or select your role to get started.
              </p>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => handleQuickAction("I am a client")}
                  className="px-2.5 py-1 bg-slate-600/70 hover:bg-slate-500/70 text-xs rounded transition-colors font-mono border border-slate-500/30"
                >
                  I am a Client
                </button>
                <button
                  onClick={() => handleQuickAction("I am a freelancer")}
                  className="px-2.5 py-1 bg-slate-600/70 hover:bg-slate-500/70 text-xs rounded transition-colors font-mono border border-slate-500/30"
                >
                  I am a Freelancer
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center p-8">
            <div className="bg-slate-700/80 text-slate-100 px-3.5 py-2.5 rounded-lg border border-slate-600/30 text-center max-w-md">
              <div className="mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-[#4299e1] to-[#3182ce] rounded-full mx-auto mb-3 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <p className="text-xs font-mono font-bold text-white mb-2">Connect Your Wallet</p>
                <p className="text-gray-300 text-xs font-mono leading-relaxed">Please connect your wallet to start creating your contract.</p>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-2.5 border-t border-slate-600/50 flex-shrink-0">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && isConnected && handleSend()}
            placeholder={
              isConnected
                ? "Type your message..."
                : "Connect wallet to chat"
            }
            className="flex-1 bg-slate-700/70 text-white px-3 py-2 rounded-lg border border-slate-600/50 focus:border-[#4299e1] focus:outline-none font-mono text-xs"
            disabled={!isConnected}
          />
          <button
            onClick={handleSend}
            disabled={!isConnected || !input.trim()}
            className={`bg-gradient-to-r from-[#4299e1] to-[#2b6cb0] text-white px-3.5 py-2 rounded-lg font-mono text-xs hover:opacity-90 transition-opacity ${(!isConnected || !input.trim()) && "opacity-50 cursor-not-allowed"
              }`}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}