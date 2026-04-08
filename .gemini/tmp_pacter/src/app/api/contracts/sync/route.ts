'use server'
import { NextRequest, NextResponse } from 'next/server';
import { RedisService, DeployedContract } from '@/lib/redisService';

// POST - Sync contracts from client localStorage to server Redis
export async function POST(request: NextRequest) {
  try {
    const { contracts } = await request.json();
    
    if (!Array.isArray(contracts)) {
      return NextResponse.json({ error: 'Contracts must be an array' }, { status: 400 });
    }
    
    // Sync contracts to Redis
    await RedisService.syncContracts(contracts);
    
    console.log('Sync: Contracts synced to Redis successfully');
    return NextResponse.json({ 
      success: true, 
      message: 'Contracts synced successfully',
      count: contracts.length 
    });
  } catch (error) {
    console.error('Sync: Error syncing contracts:', error);
    return NextResponse.json({ error: 'Failed to sync contracts' }, { status: 500 });
  }
}

// GET - Retrieve all contracts from Redis
export async function GET(request: NextRequest) {
  try {
    const contracts = await RedisService.getAllContracts();
    return NextResponse.json({ contracts });
  } catch (error) {
    console.error('Sync: Error getting contracts:', error);
    return NextResponse.json({ error: 'Failed to get contracts' }, { status: 500 });
  }
}