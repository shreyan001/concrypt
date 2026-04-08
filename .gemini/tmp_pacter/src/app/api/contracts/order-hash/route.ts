// Get order hash for a contract
import { NextRequest, NextResponse } from 'next/server'
import { RedisService } from '@/lib/redisService'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const contractId = searchParams.get('contractId')
    
    if (!contractId) {
      return NextResponse.json(
        { error: 'Contract ID is required' },
        { status: 400 }
      )
    }
    
    const contract = await RedisService.getContractById(contractId)
    
    if (!contract) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      )
    }
    
    const contractData: any = contract
    
    // Get order hash from various possible locations
    const orderHash = contractData.escrow?.orderHash || 
                     contractData.escrow?.deposit?.orderHash ||
                     null
    
    console.log('Order hash lookup:', {
      contractId,
      orderHash,
      escrow: contractData.escrow
    })
    
    return NextResponse.json({
      contractId,
      orderHash,
      hasOrderHash: !!orderHash
    })
  } catch (error: any) {
    console.error('Error fetching order hash:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch order hash' },
      { status: 500 }
    )
  }
}
