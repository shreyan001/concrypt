// Step 4: Finalize Verification (Update Contract)
import { NextRequest, NextResponse } from 'next/server'
import { RedisService } from '@/lib/redisService'

export async function POST(request: NextRequest) {
  try {
    const { 
      contractId, 
      githubUrl,
      deploymentUrl,
      comments,
      githubVerification,
      storageResult,
      agentApproval
    } = await request.json()
    
    if (!contractId) {
      return NextResponse.json(
        { error: 'Contract ID is required' },
        { status: 400 }
      )
    }
    
    const contractData = await RedisService.getContractById(contractId)
    if (!contractData) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      )
    }
    
    const contract: any = contractData
    
    // Check if milestones array exists and has at least one milestone
    // If not, create a default milestone structure
    let milestones = contract.milestones || []
    
    if (milestones.length === 0) {
      console.log('⚠️ No milestones found, creating default milestone...')
      milestones = [{
        id: `milestone_${Date.now()}`,
        number: 1,
        description: contract.description || 'Project deliverable',
        amounts: contract.escrow?.amounts || {},
        dueDate: contract.projectDetails?.endDate || null,
        status: 'PENDING',
        deliverable: {
          type: 'code',
          required: contract.projectDetails?.deliverables || [],
          submitted: false,
          submittedAt: null,
          submissionLinks: [],
          storage: null
        },
        verification: {
          agentVerified: false,
          verifiedAt: null,
          verificationNote: ''
        },
        review: {
          clientReviewed: false,
          reviewedAt: null,
          approved: null,
          feedback: '',
          revisionRequested: false,
          revisionCount: 0
        },
        payment: {
          approved: false,
          released: false,
          releasedAt: null,
          transactionHash: null
        }
      }]
    }
    
    // Update first milestone with complete deliverable and verification info
    const updatedMilestones = milestones.map((m: any, idx: number) => {
      if (idx === 0) {
        return {
          ...m,
          status: 'UNDER_REVIEW', // Update milestone status
          deliverable: {
            type: m.deliverable?.type || 'code',
            required: m.deliverable?.required || [],
            submitted: true,
            submittedAt: new Date().toISOString(),
            submissionLinks: [
              githubUrl,
              ...(githubVerification.deploymentUrl ? [githubVerification.deploymentUrl] : 
                  deploymentUrl ? [deploymentUrl] : [])
            ],
            githubUrl, // PRIVATE - Not shown to client
            deploymentUrl: githubVerification.deploymentUrl || deploymentUrl || null, // PUBLIC - Shown to client
            comments: comments || null,
            storage: {
              storageHash: storageResult.storageHash,
              storageTxHash: storageResult.storageTxHash,
              uploadedAt: new Date().toISOString(),
            }
          },
          verification: {
            agentVerified: true,
            verifiedAt: new Date().toISOString(),
            verificationNote: `GitHub repository verified: ${githubVerification.owner}/${githubVerification.repo}`,
            githubVerification: {
              owner: githubVerification.owner,
              repo: githubVerification.repo,
              commitSha: githubVerification.commitSha,
              commitShort: githubVerification.commitShort,
              githubUrl: githubVerification.githubUrl,
              verified: true,
              verifiedAt: new Date().toISOString(),
              repoDescription: githubVerification.repoDescription || null,
              homepage: githubVerification.homepage || null,
            },
            deploymentVerification: {
              deploymentUrl: githubVerification.deploymentUrl || null,
              verified: githubVerification.deploymentVerified || false,
              autoDetected: githubVerification.deploymentAutoDetected || false,
              allDetectedUrls: githubVerification.allDeploymentUrls || [],
              verificationDetails: githubVerification.verificationDetails || null,
              verifiedAt: new Date().toISOString(),
            },
            storageVerification: {
              storageHash: storageResult.storageHash,
              storageTxHash: storageResult.storageTxHash,
              verified: true,
              uploadedAt: new Date().toISOString(),
            },
            onChainVerification: {
              transactionHash: agentApproval.transactionHash,
              blockNumber: agentApproval.blockNumber,
              verifiedAt: new Date().toISOString(),
              alreadyVerified: agentApproval.alreadyVerified || false,
            }
          },
          review: {
            clientReviewed: false,
            reviewedAt: null,
            approved: null,
            feedback: '',
            revisionRequested: false,
            revisionCount: 0,
          },
          payment: {
            approved: false,
            released: false,
            releasedAt: null,
            transactionHash: null,
          }
        }
      }
      return m
    })
    
    // Update contract with proper stage progression
    const updatedContract = {
      ...contract,
      currentStage: 'Review', // Move to Review stage
      milestones: updatedMilestones,
      stageHistory: [
        ...(contract.stageHistory || []),
        {
          stage: 'Submission',
          timestamp: new Date().toISOString(),
          triggeredBy: 'freelancer',
          note: `Deliverable submitted - GitHub: ${githubUrl}${deploymentUrl ? `, Deployment: ${deploymentUrl}` : ''}`,
        },
        {
          stage: 'Review',
          timestamp: new Date().toISOString(),
          triggeredBy: 'agent',
          note: 'Agent verified deliverable - ready for client review',
          transactionHash: agentApproval.transactionHash,
        }
      ],
      lastUpdated: new Date().toISOString(),
    }
    
    await RedisService.updateContract(contractId, updatedContract)
    
    return NextResponse.json({
      success: true,
      message: 'Verification finalized successfully'
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to finalize verification' },
      { status: 500 }
    )
  }
}
