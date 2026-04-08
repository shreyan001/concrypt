// Step 3: Agent On-Chain Signing
import { NextRequest, NextResponse } from 'next/server'
import { ethers } from 'ethers'
import { Pakt_ABI } from '@/lib/contracts/paktABI'

async function agentSignVerification(orderHash: string, verificationDetails: string) {
  try {
    // Use AI_KEY first, fallback to AGENT_PRIVATE_KEY
    const privateKey = process.env.AI_KEY || process.env.AGENT_PRIVATE_KEY
    if (!privateKey) {
      throw new Error('AI_KEY or AGENT_PRIVATE_KEY not configured')
    }

    const rpcUrl = process.env.POLYGON_RPC_URL || 'https://rpc-amoy.polygon.technology/'
    const contractAddress = process.env.NEXT_PUBLIC_Pakt_CONTRACT_ADDRESS

    if (!contractAddress) {
      throw new Error('Contract address not configured')
    }

    console.log('Agent signing verification...')
    console.log('Order Hash:', orderHash)

    const provider = new ethers.JsonRpcProvider(rpcUrl)
    const wallet = new ethers.Wallet(privateKey, provider)

    console.log('Agent wallet:', wallet.address)

    const contract = new ethers.Contract(contractAddress, Pakt_ABI, wallet)

    // FIRST: Check current order state
    console.log('Checking order state before verification...')
    const order = await contract.getOrder(orderHash)
    const currentState = Number(order.currentState)

    const stateNames = ['PENDING', 'ACTIVE', 'VERIFIED', 'APPROVED', 'COMPLETED', 'DISPUTED', 'VERIFICATION_FAILED']
    console.log(`Current order state: ${currentState} (${stateNames[currentState]})`)

    // If already verified, return the existing verification
    if (currentState === 2) { // VERIFIED
      console.log('⚠️  Order is already VERIFIED!')
      console.log('Returning existing verification data...')

      return {
        success: true,
        alreadyVerified: true,
        transactionHash: order.verificationDetails ? 'Already verified' : null,
        blockNumber: Number(order.verifiedTimestamp),
        message: 'Order was already verified previously'
      }
    }

    // If not in ACTIVE state, cannot verify
    if (currentState !== 1) { // Not ACTIVE
      throw new Error(`Order must be in ACTIVE state to verify. Current state: ${stateNames[currentState]}`)
    }

    // Proceed with verification
    console.log('Order is ACTIVE, proceeding with verification...')
    const tx = await contract.verifyDeliverable(orderHash, verificationDetails, true)
    console.log('Transaction sent:', tx.hash)

    const receipt = await tx.wait()
    console.log('Transaction confirmed in block:', receipt.blockNumber)

    return {
      success: true,
      alreadyVerified: false,
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber
    }
  } catch (error: any) {
    console.error('Agent signing error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { orderHash, verificationDetails } = await request.json()

    if (!orderHash) {
      return NextResponse.json(
        { error: 'Order hash is required' },
        { status: 400 }
      )
    }

    const result = await agentSignVerification(orderHash, verificationDetails)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Agent signing failed' },
      { status: 500 }
    )
  }
}
