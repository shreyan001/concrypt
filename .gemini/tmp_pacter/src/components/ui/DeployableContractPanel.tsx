'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { contractsByKey, type ContractArtifact, type ContractKey } from '@/lib/contractCompile'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { Check, Code as CodeIcon, Copy, Layers } from 'lucide-react'

type CopyTarget = 'code' | 'bytecode'

interface DeploymentParameters {
  client: string
  freelancer: string
  agent?: string
  arbitration: string
  vault: string
  storageFeeWei?: string
}

interface DeployableContractPanelProps {
  contractKey?: ContractKey
  contract?: ContractArtifact
  className?: string
  deploymentParameters?: DeploymentParameters
}

interface SectionHeaderProps {
  icon: ReactNode
  title: string
  description?: string
}

function SectionHeader({ icon, title, description }: SectionHeaderProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
        {icon}
        <span>{title}</span>
      </div>
      {description ? <p className="text-sm text-muted-foreground/80">{description}</p> : null}
    </div>
  )
}

export function DeployableContractPanel({ contractKey, contract: contractOverride, className, deploymentParameters }: DeployableContractPanelProps) {
  const contract = useMemo<ContractArtifact | undefined>(() => {
    if (contractOverride) return contractOverride
    if (contractKey) return contractsByKey[contractKey]
    return undefined
  }, [contractKey, contractOverride])

  const [expandedSections, setExpandedSections] = useState<Record<CopyTarget, boolean>>({
    code: false,
    bytecode: false
  })

  const [copyState, setCopyState] = useState<Record<CopyTarget, boolean>>({
    code: false,
    bytecode: false
  })

  if (!contract) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader>
          <CardTitle>Contract unavailable</CardTitle>
          <CardDescription>Select a valid contract artifact to continue.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const toggleSection = (section: CopyTarget) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const handleCopy = (section: CopyTarget, value: string | undefined) => {
    if (!value) return
    navigator.clipboard.writeText(value)
    setCopyState((prev) => ({
      ...prev,
      [section]: true
    }))
    setTimeout(() => {
      setCopyState((prev) => ({
        ...prev,
        [section]: false
      }))
    }, 1800)
  }

  const bytecodeDisplay = contract.bytecode && contract.bytecode.length > 0 ? contract.bytecode : 'Bytecode will be populated after compilation.'
  const bytecodeCopyValue = contract.bytecode && contract.bytecode.length > 0 ? contract.bytecode : undefined
  const deploymentList = deploymentParameters
    ? [
        { label: 'Client (Party A)', value: deploymentParameters.client },
        { label: 'Freelancer (Party B)', value: deploymentParameters.freelancer },
        { label: 'Agent', value: deploymentParameters.agent },
        { label: 'Arbitration', value: deploymentParameters.arbitration },
        { label: 'DeFi Vault', value: deploymentParameters.vault },
      ].filter((item) => Boolean(item.value))
    : []

  return (
    <Card className={cn('w-full space-y-6', className)}>
      <CardHeader className="space-y-4">
        <div className="space-y-2">
          <CardTitle className="text-2xl font-semibold">{contract.name}</CardTitle>
          <CardDescription className="text-base">Precompiled artifact ready for deployment.</CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {deploymentParameters ? (
          <div className="space-y-3 rounded-lg border border-border/60 bg-muted/5 p-4">
            <SectionHeader icon={<Layers className="h-4 w-4" />} title="Constructor parameters" />
            <ul className="space-y-2 text-sm text-muted-foreground">
              {deploymentList.map((entry) => (
                <li key={entry.label} className="flex flex-col gap-1">
                  <span className="text-xs uppercase tracking-wide text-muted-foreground/70">{entry.label}</span>
                  <span className="font-mono text-foreground break-all">{entry.value}</span>
                </li>
              ))}
            </ul>
            {deploymentParameters.storageFeeWei ? (
              <div className="pt-2 text-xs text-muted-foreground/80">
                Storage Fee (wei): <span className="font-mono text-foreground/90">{deploymentParameters.storageFeeWei}</span>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="space-y-4">
          <SectionHeader icon={<CodeIcon className="h-4 w-4" />} title="Compiled artifacts" />

          <div className="space-y-4 rounded-lg border border-border/60 bg-muted/5 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-sm font-semibold text-foreground">Contract source</span>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => toggleSection('code')}>
                  {expandedSections.code ? 'Hide source' : 'Show source'}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleCopy('code', contract.contractCode)}
                  disabled={!contract.contractCode}
                  className="flex items-center gap-2"
                >
                  {copyState.code ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copyState.code ? 'Copied' : 'Copy'}
                </Button>
              </div>
            </div>
            {expandedSections.code ? (
              <ScrollArea className="h-72 rounded-md border border-border/60 bg-background/60 p-4">
                <pre className="whitespace-pre text-sm leading-relaxed text-foreground/90">{contract.contractCode}</pre>
              </ScrollArea>
            ) : null}
          </div>

          <div className="space-y-4 rounded-lg border border-border/60 bg-muted/5 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-sm font-semibold text-foreground">Bytecode</span>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => toggleSection('bytecode')}>
                  {expandedSections.bytecode ? 'Hide bytecode' : 'Show bytecode'}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleCopy('bytecode', bytecodeCopyValue)}
                  disabled={!bytecodeCopyValue}
                  className="flex items-center gap-2"
                >
                  {copyState.bytecode ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copyState.bytecode ? 'Copied' : 'Copy'}
                </Button>
              </div>
            </div>
            {expandedSections.bytecode ? (
              <ScrollArea className="h-52 rounded-md border border-border/60 bg-background/60 p-4">
                <pre className="whitespace-pre-wrap break-words text-xs leading-relaxed text-foreground/90">{bytecodeDisplay}</pre>
              </ScrollArea>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
