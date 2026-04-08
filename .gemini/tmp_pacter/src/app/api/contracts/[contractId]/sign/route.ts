import { NextRequest, NextResponse } from 'next/server';
import { RedisService } from '@/lib/redisService';

export async function POST(
  request: NextRequest,
  { params }: { params: { contractId: string } }
) {
  try {
    const { contractId } = params;
    const body = await request.json();
    const { signature, role, walletAddress, freelancerInfo } = body;

    console.log('Sign request:', { contractId, role, walletAddress, hasFreelancerInfo: !!freelancerInfo });

    if (!signature || !role || !walletAddress) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Fetch contract from database
    const database = await RedisService.getDatabase();
    const contractIndex = database.contracts.findIndex((c: any) => c.id === contractId);
    
    if (contractIndex === -1) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    const contract: any = database.contracts[contractIndex];

    // Verify wallet address matches the role
    if (role === 'client') {
      if (walletAddress.toLowerCase() !== contract.parties.client.walletAddress.toLowerCase()) {
        return NextResponse.json(
          { error: 'Wallet address does not match client' },
          { status: 403 }
        );
      }

      // Update client signature
      contract.signatures.client = {
        signed: true,
        signedAt: new Date().toISOString(),
        signature
      };

      // Add to stage history
      contract.stageHistory.push({
        stage: 'Client Signed',
        timestamp: new Date().toISOString(),
        triggeredBy: 'user',
        note: `Client ${contract.parties.client.name} signed the contract`
      });

    } else if (role === 'freelancer') {
      // If freelancer info is provided, update it
      if (freelancerInfo) {
        contract.parties.freelancer.name = freelancerInfo.name;
        contract.parties.freelancer.email = freelancerInfo.email;
        contract.parties.freelancer.walletAddress = walletAddress;
      }

      if (walletAddress.toLowerCase() !== contract.parties.freelancer.walletAddress?.toLowerCase()) {
        return NextResponse.json(
          { error: 'Wallet address does not match freelancer' },
          { status: 403 }
        );
      }

      // Update freelancer signature
      contract.signatures.freelancer = {
        signed: true,
        signedAt: new Date().toISOString(),
        signature
      };

      // Add to stage history
      contract.stageHistory.push({
        stage: 'Freelancer Signed',
        timestamp: new Date().toISOString(),
        triggeredBy: 'user',
        note: `Freelancer ${contract.parties.freelancer.name} signed the contract`
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Check if both parties have signed
    const bothSigned = contract.signatures.client.signed && contract.signatures.freelancer.signed;
    contract.signatures.bothSigned = bothSigned;

    if (bothSigned) {
      contract.currentStage = 'Awaiting Deposit';
      contract.stageHistory.push({
        stage: 'Both Parties Signed',
        timestamp: new Date().toISOString(),
        triggeredBy: 'system',
        note: 'Contract fully signed by both parties'
      });
    }

    contract.lastUpdated = new Date().toISOString();

    // Save updated contract back to database
    database.contracts[contractIndex] = contract;
    const success = await RedisService.setDatabase(database);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to save signature' },
        { status: 500 }
      );
    }

    console.log('Signature saved successfully:', { contractId, role, bothSigned });

    return NextResponse.json({
      success: true,
      bothSigned,
      contract
    });

  } catch (error) {
    console.error('Error processing signature:', error);
    return NextResponse.json(
      { error: 'Failed to process signature' },
      { status: 500 }
    );
  }
}
