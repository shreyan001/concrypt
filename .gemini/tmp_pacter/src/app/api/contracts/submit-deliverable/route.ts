import { NextRequest, NextResponse } from 'next/server'
import { ethers } from 'ethers'
import { Pakt_ABI } from '@/lib/contracts/paktABI'

// GitHub verification functions
async function verifyGitHubDeployment(githubUrl: string, deploymentUrl?: string) {
  try {
    // Parse GitHub URL
    const match = githubUrl.match(/github\.com\/([^/]+)\/([^/]+)/)
    if (!match) {
      throw new Error('Invalid GitHub URL format')
    }

    const [, owner, repo] = match
    const cleanRepo = repo.replace(/\.git$/, '')

    // Basic GitHub API check
    const repoResponse = await fetch(`https://api.github.com/repos/${owner}/${cleanRepo}`, {
      headers: {
        'Authorization': process.env.GITHUB_TOKEN ? `token ${process.env.GITHUB_TOKEN}` : '',
        'Accept': 'application/vnd.github.v3+json'
      }
    })

    if (!repoResponse.ok) {
      throw new Error('Repository not found or not accessible')
    }

    const repoData = await repoResponse.json()

    // Get latest commit
    const commitsResponse = await fetch(`https://api.github.com/repos/${owner}/${cleanRepo}/commits`, {
      headers: {
        'Authorization': process.env.GITHUB_TOKEN ? `token ${process.env.GITHUB_TOKEN}` : '',
        'Accept': 'application/vnd.github.v3+json'
      }
    })

    const commits = await commitsResponse.json()
    const latestCommit = commits[0]

    // Basic deployment verification (if URL provided)
    let deploymentVerified = true
    if (deploymentUrl) {
      try {
        const deployResponse = await fetch(deploymentUrl, { method: 'HEAD', signal: AbortSignal.timeout(5000) })
        deploymentVerified = deployResponse.ok
      } catch {
        deploymentVerified = false
      }
    }

    return {
      verified: true,
      repoInfo: {
        owner,
        repo: cleanRepo,
        description: repoData.description,
        lastCommit: latestCommit.sha,
        commitMessage: latestCommit.commit.message,
        commitDate: latestCommit.commit.author.date
      },
      deploymentVerified,
      message: 'Repository verified successfully'
    }
  } catch (error: any) {
    return {
      verified: false,
      message: error.message || 'Verification failed'
    }
  }
}

// Store repository metadata (simplified - can use Filecoin in future)
async function storeRepositoryMetadata(githubUrl: string, repoInfo: any) {
  try {
    // Create metadata object
    const metadata = {
      githubUrl,
      repoInfo,
      verifiedAt: new Date().toISOString(),
      verificationAgent: 'Pakt-AI-Agent'
    }

    // In production, this would upload to filecoin storage
    // For now, we'll simulate with a hash
    const metadataString = JSON.stringify(metadata)
    const hash = ethers.keccak256(ethers.toUtf8Bytes(metadataString))

    return {
      success: true,
      storageHash: hash,
      metadata
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    }
  }
}

// Call smart contract verifyDeliverable function
async function callAgentVerification(orderHash: string) {
  try {
    const privateKey = process.env.AGENT_PRIVATE_KEY!
    const rpcUrl = process.env.POLYGON_RPC_URL || 'https://rpc-amoy.polygon.technology/'
    const contractAddress = process.env.NEXT_PUBLIC_Pakt_CONTRACT_ADDRESS!

    const provider = new ethers.JsonRpcProvider(rpcUrl)
    const wallet = new ethers.Wallet(privateKey, provider)

    const contract = new ethers.Contract(contractAddress, Pakt_ABI, wallet)

    // Call verifyDeliverable
    const tx = await contract.verifyDeliverable(orderHash)
    const receipt = await tx.wait()

    return {
      success: true,
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber
    }
  } catch (error: any) {
    console.error('Agent verification error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { contractId, githubUrl, deploymentUrl, comments, freelancerAddress } = body

    // Validate inputs
    if (!contractId || !githubUrl || !freelancerAddress) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Fetch contract from backend
    const contractResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/contracts?id=${contractId}`)
    if (!contractResponse.ok) {
      throw new Error('Contract not found')
    }

    const contract = await contractResponse.json()

    // Verify freelancer
    if (contract.parties?.freelancer?.walletAddress?.toLowerCase() !== freelancerAddress.toLowerCase()) {
      return NextResponse.json(
        { error: 'Unauthorized: Not the contract freelancer' },
        { status: 403 }
      )
    }

    // Step 1: Verify GitHub repository
    const verificationResult = await verifyGitHubDeployment(githubUrl, deploymentUrl)

    if (!verificationResult.verified) {
      return NextResponse.json(
        { error: verificationResult.message },
        { status: 400 }
      )
    }

    // Step 2: Store metadata on POL (simulated)
    const storageResult = await storeRepositoryMetadata(githubUrl, verificationResult.repoInfo)

    if (!storageResult.success) {
      return NextResponse.json(
        { error: 'Failed to store verification data' },
        { status: 500 }
      )
    }

    // Step 3: Update backend with submission
    const updateResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/contracts`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: contractId,
        currentStage: 'AI Verification',
        milestones: contract.milestones.map((m: any, idx: number) =>
          idx === 0 ? {
            ...m,
            deliverable: {
              ...m.deliverable,
              submitted: true,
              submittedAt: new Date().toISOString(),
              submissionLinks: [githubUrl],
              deploymentUrl: deploymentUrl || null,
              comments: comments || null,
            },
            verification: {
              ...m.verification,
              githubVerified: true,
              githubVerifiedAt: new Date().toISOString(),
              repoInfo: verificationResult.repoInfo,
              storageHash: storageResult.storageHash,
            }
          } : m
        ),
        stageHistory: [
          ...(contract.stageHistory || []),
          {
            stage: 'AI Verification',
            timestamp: new Date().toISOString(),
            triggeredBy: 'freelancer',
            note: 'Deliverable submitted for verification',
          }
        ]
      })
    })

    if (!updateResponse.ok) {
      throw new Error('Failed to update contract')
    }

    // Step 4: Call smart contract verification (async)
    const orderHash = contract.escrow?.orderHash || contract.escrow?.deposit?.orderHash

    if (orderHash) {
      // Run verification in background
      callAgentVerification(orderHash).then(async (result) => {
        // Update backend with verification result
        await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/contracts`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: contractId,
            currentStage: result.success ? 'Client Review' : 'AI Verification',
            milestones: contract.milestones.map((m: any, idx: number) =>
              idx === 0 ? {
                ...m,
                verification: {
                  ...m.verification,
                  agentVerified: result.success,
                  agentVerifiedAt: result.success ? new Date().toISOString() : null,
                  verificationTransactionHash: result.transactionHash || null,
                  verificationError: result.error || null,
                }
              } : m
            ),
            stageHistory: [
              ...(contract.stageHistory || []),
              {
                stage: result.success ? 'Client Review' : 'AI Verification Failed',
                timestamp: new Date().toISOString(),
                triggeredBy: 'agent',
                note: result.success ? 'AI verification passed' : `Verification failed: ${result.error}`,
                transactionHash: result.transactionHash || null,
              }
            ]
          })
        })
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Deliverable submitted successfully',
      verification: verificationResult,
      storage: storageResult
    })

  } catch (error: any) {
    console.error('Submit deliverable error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to submit deliverable' },
      { status: 500 }
    )
  }
}
