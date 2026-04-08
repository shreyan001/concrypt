'use client'

import React from 'react'
import { CheckCircle2, Loader2, AlertCircle, ExternalLink, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface VerificationStep {
  id: string
  title: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  details?: string
  link?: string
}

interface VerificationModalProps {
  isOpen: boolean
  onClose: () => void
  steps: VerificationStep[]
  currentStep: number
  error?: string | null
}

export default function VerificationModal({ 
  isOpen, 
  onClose, 
  steps, 
  currentStep,
  error 
}: VerificationModalProps) {
  if (!isOpen) return null

  const allCompleted = steps.every(step => step.status === 'completed')
  const hasError = steps.some(step => step.status === 'error') || error

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm font-mono">
      <div className="relative w-full max-w-2xl mx-4 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div>
            <h2 className="text-xl font-semibold text-white">
              {hasError ? '❌ Verification Failed' : allCompleted ? '✅ Verification Complete' : '🔄 Verifying Deliverable'}
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              {hasError 
                ? 'An error occurred during verification' 
                : allCompleted 
                ? 'All verification steps completed successfully' 
                : 'Please wait while we verify your submission'}
            </p>
          </div>
          {(allCompleted || hasError) && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Progress Bar */}
        <div className="px-6 pt-4">
          <div className="w-full bg-slate-800 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${
                hasError ? 'bg-red-500' : allCompleted ? 'bg-green-500' : 'bg-indigo-500'
              }`}
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-slate-400">
            <span>Step {currentStep + 1} of {steps.length}</span>
            <span>{Math.round(((currentStep + 1) / steps.length) * 100)}%</span>
          </div>
        </div>

        {/* Steps */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`p-4 rounded-lg border transition-all ${
                step.status === 'completed'
                  ? 'bg-green-500/10 border-green-500/30'
                  : step.status === 'processing'
                  ? 'bg-indigo-500/10 border-indigo-500/30'
                  : step.status === 'error'
                  ? 'bg-red-500/10 border-red-500/30'
                  : 'bg-slate-800/50 border-slate-700'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="flex-shrink-0 mt-0.5">
                  {step.status === 'completed' && (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  )}
                  {step.status === 'processing' && (
                    <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
                  )}
                  {step.status === 'error' && (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  )}
                  {step.status === 'pending' && (
                    <div className="w-5 h-5 rounded-full border-2 border-slate-600" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className={`font-medium ${
                      step.status === 'completed'
                        ? 'text-green-400'
                        : step.status === 'processing'
                        ? 'text-indigo-400'
                        : step.status === 'error'
                        ? 'text-red-400'
                        : 'text-slate-400'
                    }`}>
                      {step.title}
                    </h3>
                    {step.status === 'processing' && (
                      <span className="text-xs text-indigo-400 animate-pulse">
                        Processing...
                      </span>
                    )}
                  </div>
                  
                  {step.details && (
                    <p className="text-sm text-slate-400 mt-1 break-all">
                      {step.details}
                    </p>
                  )}

                  {step.link && step.status === 'completed' && (
                    <a
                      href={step.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 mt-2"
                    >
                      View Details <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-400">Error Details</h4>
                  <p className="text-sm text-red-300 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-700">
          {allCompleted && (
            <div className="space-y-3">
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                <p className="text-green-400 text-sm">
                  🎉 Your deliverable has been successfully verified and is now ready for client review!
                </p>
              </div>
              <Button
                onClick={() => {
                  console.log('Closing modal - contract will auto-update...')
                  onClose()
                }}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-mono"
              >
                Close & Continue
              </Button>
            </div>
          )}

          {hasError && (
            <div className="space-y-3">
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <p className="text-red-400 text-sm">
                  Please check the error details above and try again.
                </p>
              </div>
              <Button
                onClick={onClose}
                variant="outline"
                className="w-full border-slate-600 text-slate-300 hover:bg-slate-700 font-mono"
              >
                Close
              </Button>
            </div>
          )}

          {!allCompleted && !hasError && (
            <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-lg p-4">
              <p className="text-indigo-300 text-sm text-center">
                ⏳ Verification in progress... Please do not close this window.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
