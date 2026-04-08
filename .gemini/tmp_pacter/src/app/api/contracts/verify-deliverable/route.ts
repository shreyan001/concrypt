import { NextRequest, NextResponse } from 'next/server'
import { ethers } from 'ethers'
import { Pakt_ABI } from '@/lib/contracts/paktABI'
import { RedisService } from '@/lib/redisService'
import download from 'download-git-repo'
import fs from 'fs'
import path from 'path'
import { FilecoinStorageService } from '@/lib/filecoinStorageService'

// GitHub verification function
async function verifyGitHubDeployment(githubUrl: string, deploymentUrl?: string) {
  try {
    // Parse GitHub URL to get owner/repo
    const match = githubUrl.match(/github\.com\/([^/]+)\/([^/]+)/)
    if (!match) {
      throw new Error('Invalid GitHub URL format')
    }

    const [, owner, repo] = match
    const cleanRepo = repo.replace(/\.git$/, '')

    console.log(`Verifying GitHub repo: ${owner}/${cleanRepo}`)

    // Build headers - only include Authorization if token exists
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Pakt-Verification-Agent'
    }

    if (process.env.GITHUB_TOKEN) {
      headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`
    }

    // Get repository info from GitHub API with timeout
    const repoResponse = await fetch(`https://api.github.com/repos/${owner}/${cleanRepo}`, {
      headers,
      signal: AbortSignal.timeout(10000) // 10 second timeout
    })

    if (!repoResponse.ok) {
      const errorText = await repoResponse.text()
      console.error('GitHub API error:', repoResponse.status, errorText)
      throw new Error(`Repository not found or not accessible (${repoResponse.status})`)
    }

    await repoResponse.json() // Parse but don't need to use

    // Get latest commit
    const commitsResponse = await fetch(`https://api.github.com/repos/${owner}/${cleanRepo}/commits`, {
      headers,
      signal: AbortSignal.timeout(10000)
    })

    if (!commitsResponse.ok) {
      const errorText = await commitsResponse.text()
      console.error('GitHub commits API error:', commitsResponse.status, errorText)
      throw new Error(`Failed to fetch commits (${commitsResponse.status})`)
    }

    const commits = await commitsResponse.json()

    if (!commits || commits.length === 0) {
      throw new Error('No commits found in repository')
    }

    const latestCommit = commits[0]

    // Verify deployment URL if provided
    let deploymentVerified = true
    if (deploymentUrl) {
      try {
        const deployResponse = await fetch(deploymentUrl, {
          method: 'HEAD',
          signal: AbortSignal.timeout(5000)
        })
        deploymentVerified = deployResponse.ok
      } catch (err) {
        console.log('Deployment URL check failed:', err)
        deploymentVerified = false
      }
    }

    return {
      verified: true,
      owner,
      repo: cleanRepo,
      commitSha: latestCommit.sha,
      commitShort: latestCommit.sha.substring(0, 7),
      commitMessage: latestCommit.commit.message,
      commitDate: latestCommit.commit.author.date,
      githubUrl: `https://github.com/${owner}/${cleanRepo}`,
      deploymentVerified,
      message: 'Repository verified successfully'
    }
  } catch (error: any) {
    console.error('GitHub verification error:', error)

    // Provide more specific error messages
    let errorMessage = 'Verification failed'
    if (error.name === 'AbortError') {
      errorMessage = 'GitHub API request timed out. Please try again.'
    } else if (error.message.includes('fetch')) {
      errorMessage = 'Network error connecting to GitHub. Please check your connection.'
    } else {
      errorMessage = error.message || 'Verification failed'
    }

    return {
      verified: false,
      message: errorMessage
    }
  }
}

// Download repository and upload to Filecoin/IPFS storage
async function downloadAndUploadToFilecoin(githubUrl: string, repoInfo: any) {
  const tempDir = path.join(process.cwd(), 'tmp', `repo-${Date.now()}`)

  try {
    console.log(`Downloading repository from ${githubUrl} to ${tempDir}...`)

    // Extract owner and repo from githubUrl
    const match = githubUrl.match(/github\.com\/([^/]+)\/([^/]+)/)
    if (!match) {
      throw new Error('Invalid GitHub URL format')
    }
    const [, owner, repo] = match
    const repoSlug = `${owner}/${repo.replace('.git', '')}`

    await new Promise<void>((resolve, reject) => {
      download(repoSlug, tempDir, { clone: true }, (err: Error) => {
        if (err) {
          return reject(err)
        }
        resolve()
      })
    })

    console.log('Repository downloaded successfully. Uploading to Filecoin...')

    // Initialize Filecoin Storage Service
    const storageService = new FilecoinStorageService()

    if (!storageService.isConfigured()) {
      console.warn('Filecoin storage not configured, skipping upload')
      return {
        success: true,
        storageCid: null,
        storageUrl: null,
        message: 'Repository downloaded but Filecoin storage not configured',
      }
    }

    const uploadResult = await storageService.uploadFolder(tempDir)

    if (!uploadResult.success) {
      throw new Error(uploadResult.error || 'Failed to upload folder to Filecoin')
    }

    console.log('Repository uploaded to Filecoin/IPFS.')

    return {
      success: true,
      storageCid: uploadResult.cid,
      storageUrl: uploadResult.url,
      message: 'Repository downloaded and uploaded to Filecoin/IPFS',
    }
  } catch (error: any) {
    console.error('Filecoin upload error:', error)
    return {
      success: false,
      error: error.message,
      storageCid: null,
    }
  } finally {
    // Clean up temporary directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true })
      console.log(`Cleaned up temporary directory: ${tempDir}`)
    }
  }
}

// Agent approves milestone on-chain
async function agentApproveMilestone(orderHash: string) {
  try {
    const privateKey = process.env.AGENT_PRIVATE_KEY
    if (!privateKey) {
      throw new Error('AGENT_PRIVATE_KEY not configured')
    }

    const rpcUrl = process.env.POLYGON_RPC_URL || 'https://rpc-amoy.polygon.technology/'
    const contractAddress = process.env.NEXT_PUBLIC_Pakt_CONTRACT_ADDRESS

    if (!contractAddress) {
      throw new Error('Contract address not configured')
    }

    console.log('Agent approving milestone on-chain...')
    console.log('Order Hash:', orderHash)
    console.log('Contract:', contractAddress)

    const provider = new ethers.JsonRpcProvider(rpcUrl)
    const wallet = new ethers.Wallet(privateKey, provider)

    const contract = new ethers.Contract(contractAddress, Pakt_ABI, wallet)

    // Call verifyDeliverable with verification details
    const verificationDetails = JSON.stringify({
      verifiedBy: 'Pakt-AI-Agent',
      verifiedAt: new Date().toISOString(),
      method: 'GitHub + Filecoin Storage'
    })

    const tx = await contract.verifyDeliverable(orderHash, verificationDetails, true)
    console.log('Transaction sent:', tx.hash)

    const receipt = await tx.wait()
    console.log('Transaction confirmed in block:', receipt.blockNumber)

    return {
      success: true,
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber
    }
  } catch (error: any) {
    console.error('Agent approval error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== Verification API Called ===')

    const body = await request.json()
    const { contractId, githubUrl, deploymentUrl, comments, freelancerAddress, orderHash: providedOrderHash } = body

    console.log('Contract ID:', contractId)
    console.log('GitHub URL:', githubUrl)
    console.log('Deployment URL:', deploymentUrl)
    console.log('Freelancer:', freelancerAddress)
    console.log('Order Hash (provided):', providedOrderHash)

    // Validate inputs
    if (!contractId || !githubUrl || !freelancerAddress) {
      console.error('Missing required fields')
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Fetch contract from Redis
    console.log('Fetching contract from Redis:', contractId)
    const contractData = await RedisService.getContractById(contractId)

    if (!contractData) {
      console.error('Contract not found in Redis:', contractId)
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      )
    }

    // Cast to any since this is a new-format contract with different structure
    const contract: any = contractData
    console.log('Contract found:', contract.id)

    // Verify freelancer
    if (contract.parties?.freelancer?.walletAddress?.toLowerCase() !== freelancerAddress.toLowerCase()) {
      return NextResponse.json(
        { error: 'Unauthorized: Not the contract freelancer' },
        { status: 403 }
      )
    }

    // Get order hash - use provided one or get from contract
    const orderHash = providedOrderHash || contract.escrow?.orderHash || contract.escrow?.deposit?.orderHash

    if (!orderHash) {
      console.error('Order hash not found. Contract escrow:', contract.escrow)
      return NextResponse.json(
        { error: 'Order hash not found. Please ensure escrow has been deposited.' },
        { status: 400 }
      )
    }

    console.log('Using order hash for verification:', orderHash)

    // STEP 1: Verify GitHub repository
    console.log('Step 1: Verifying GitHub repository...')
    let githubVerification
    try {
      githubVerification = await verifyGitHubDeployment(githubUrl, deploymentUrl)
      console.log('GitHub verification result:', githubVerification)
    } catch (err: any) {
      console.error('GitHub verification failed:', err)
      throw new Error('GitHub verification failed: ' + err.message)
    }

    if (!githubVerification.verified) {
      console.error('GitHub verification returned false:', githubVerification.message)
      return NextResponse.json(
        { error: githubVerification.message },
        { status: 400 }
      )
    }

    // STEP 2: Download and upload to Filecoin storage
    console.log('Step 2: Uploading to Filecoin/IPFS storage...')
    let storageResult
    try {
      storageResult = await downloadAndUploadToFilecoin(githubUrl, githubVerification)
      console.log('Storage result:', storageResult)
    } catch (err: any) {
      console.error('Filecoin storage failed:', err)
      throw new Error('Filecoin storage failed: ' + err.message)
    }

    if (!storageResult.success) {
      console.error('Storage upload returned false:', storageResult.error)
      return NextResponse.json(
        { error: 'Failed to upload to Filecoin storage: ' + storageResult.error },
        { status: 500 }
      )
    }

    // STEP 3: Update Redis with submission data
    console.log('Step 3: Updating Redis with submission...')

    // Prepare updated milestones
    const updatedMilestones = (contract.milestones || []).map((m: any, idx: number) => {
      if (idx === 0) {
        return {
          ...m,
          deliverable: {
            ...(m.deliverable || {}),
            submitted: true,
            submittedAt: new Date().toISOString(),
            githubUrl: githubUrl,
            deploymentUrl: deploymentUrl || null,
            comments: comments || null,
          },
          verification: {
            ...(m.verification || {}),
            githubVerified: true,
            githubVerifiedAt: new Date().toISOString(),
            repoInfo: {
              owner: githubVerification.owner,
              repo: githubVerification.repo,
              commitSha: githubVerification.commitSha,
              commitShort: githubVerification.commitShort,
              githubUrl: githubVerification.githubUrl,
              verifiedAt: new Date().toISOString(),
            },
            storageCid: storageResult.storageCid,
            storageUrl: storageResult.storageUrl,
            deploymentVerified: githubVerification.deploymentVerified,
          }
        }
      }
      return m
    })

    const updatedContract = {
      ...contract,
      currentStage: 'Submission',
      milestones: updatedMilestones,
      stageHistory: [
        ...(contract.stageHistory || []),
        {
          stage: 'Submission',
          timestamp: new Date().toISOString(),
          triggeredBy: 'freelancer',
          note: 'Deliverable submitted - GitHub verified, uploaded to Filecoin/IPFS',
        }
      ]
    }

    await RedisService.updateContract(contractId, updatedContract)
    console.log('Redis updated successfully with submission data')

    // STEP 4: Agent approves milestone on-chain
    console.log('Step 4: Agent approving milestone on-chain...')
    console.log('Order hash:', orderHash)

    let agentApproval
    try {
      agentApproval = await agentApproveMilestone(orderHash)
      console.log('Agent approval result:', agentApproval)
    } catch (err: any) {
      console.error('Agent approval failed:', err)
      throw new Error('Agent approval failed: ' + err.message)
    }

    if (!agentApproval.success) {
      // Update Redis with verification failure
      console.log('Agent approval failed, updating Redis...')

      // Fetch fresh contract data
      const freshContractData = await RedisService.getContractById(contractId)
      if (!freshContractData) {
        throw new Error('Contract not found after agent approval failure')
      }
      const freshContract: any = freshContractData

      const failedMilestones = (freshContract.milestones || []).map((m: any, idx: number) => {
        if (idx === 0) {
          return {
            ...m,
            verification: {
              ...(m.verification || {}),
              agentVerified: false,
              verificationError: agentApproval.error,
              verificationFailedAt: new Date().toISOString(),
            }
          }
        }
        return m
      })

      const failedContract = {
        ...freshContract,
        currentStage: 'Submission',
        milestones: failedMilestones,
        stageHistory: [
          ...(freshContract.stageHistory || []),
          {
            stage: 'Verification Failed',
            timestamp: new Date().toISOString(),
            triggeredBy: 'agent',
            note: 'Agent verification failed: ' + agentApproval.error,
          }
        ]
      }

      await RedisService.updateContract(contractId, failedContract)

      return NextResponse.json(
        { error: 'Agent verification failed: ' + agentApproval.error },
        { status: 500 }
      )
    }

    // STEP 5: Update Redis with final verification
    console.log('Step 5: Updating Redis with verification complete...')

    // Fetch fresh contract data to get latest milestones
    const freshContractData = await RedisService.getContractById(contractId)
    if (!freshContractData) {
      throw new Error('Contract not found after agent approval')
    }
    const freshContract: any = freshContractData

    // Prepare final updated milestones
    const finalMilestones = (freshContract.milestones || []).map((m: any, idx: number) => {
      if (idx === 0) {
        return {
          ...m,
          verification: {
            ...(m.verification || {}),
            agentVerified: true,
            agentVerifiedAt: new Date().toISOString(),
            verificationTransactionHash: agentApproval.transactionHash,
            verificationBlockNumber: agentApproval.blockNumber,
          }
        }
      }
      return m
    })

    const finalContract = {
      ...freshContract,
      currentStage: 'Review',
      milestones: finalMilestones,
      stageHistory: [
        ...(freshContract.stageHistory || []),
        {
          stage: 'Review',
          timestamp: new Date().toISOString(),
          triggeredBy: 'agent',
          note: 'Agent verified deliverable on-chain - ready for client review',
          transactionHash: agentApproval.transactionHash,
        }
      ]
    }

    await RedisService.updateContract(contractId, finalContract)
    console.log('Redis updated successfully with agent verification')

    console.log('=== Verification Complete ===')

    return NextResponse.json({
      success: true,
      message: 'Deliverable verified successfully',
      verification: {
        github: githubVerification,
        storage: storageResult,
        onChain: agentApproval
      }
    })

  } catch (error: any) {
    console.error('=== Verification Error ===')
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    console.error('Full error:', error)

    return NextResponse.json(
      {
        error: error.message || 'Verification failed',
        details: error.stack || 'No stack trace available'
      },
      { status: 500 }
    )
  }
}
