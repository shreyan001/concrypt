// Step 1: GitHub Verification
import { NextRequest, NextResponse } from 'next/server'
import { PROBLEPOL_DEPLOYMENT_URL } from '@/lib/github/verifyDeployment'

async function verifyGitHubRepository(githubUrl: string, deploymentUrl?: string) {
  try {
    // Import the GitHub verification functions
    const { getRepoInfoFromUrl, verifyDeploymentFromUrl } = await import('@/lib/github/verifyDeployment')

    console.log(`🔍 Verifying GitHub repo: ${githubUrl}`)

    // Get repository info including auto-detected deployment URLs
    const repoInfo = await getRepoInfoFromUrl(githubUrl)

    console.log('📦 Repository info:', {
      owner: repoInfo.owner,
      repo: repoInfo.repo,
      lastCommit: repoInfo.lastCommit,
      deploymentUrls: repoInfo.deploymentUrls
    })

    // Determine which deployment URL to use
    let finalDeploymentUrl = deploymentUrl
    let autoDetected = false

    // If no deployment URL provided, try to auto-detect
    if (!finalDeploymentUrl && repoInfo.deploymentUrls.length > 0) {
      // Prefer Vercel > Netlify > GitHub Pages > Other
      finalDeploymentUrl = repoInfo.vercelUrl ||
        repoInfo.netlifyUrl ||
        repoInfo.githubPages ||
        repoInfo.deploymentUrls[0]
      autoDetected = true
      console.log(`✨ Auto-detected deployment URL: ${finalDeploymentUrl}`)
    }

    // Verify deployment matches the code
    let deploymentVerified = false
    let verificationDetails = null

    if (finalDeploymentUrl) {
      try {
        console.log(`🔐 Verifying deployment matches code...`)
        const verification = await verifyDeploymentFromUrl({
          repoUrl: githubUrl,
          deployedUrl: finalDeploymentUrl,
          fileToCheck: 'package.json' // Can be made configurable
        })

        deploymentVerified = verification.verified
        verificationDetails = {
          fileMatch: verification.fileMatch,
          message: verification.message,
          error: verification.error
        }

        console.log(`${deploymentVerified ? '✅' : '❌'} Deployment verification: ${verification.message}`)
      } catch (error: any) {
        console.warn('⚠️ Deployment verification failed:', error.message)
        // Don't fail the whole process if deployment verification fails
        deploymentVerified = false
        verificationDetails = {
          fileMatch: false,
          message: `Could not verify deployment: ${error.message}`,
          error: error.message
        }
      }
    }

    return {
      success: true,
      owner: repoInfo.owner,
      repo: repoInfo.repo,
      commitSha: repoInfo.lastCommit,
      commitShort: repoInfo.lastCommit.substring(0, 7),
      githubUrl: `https://github.com/${repoInfo.owner}/${repoInfo.repo}`,
      deploymentUrl: finalDeploymentUrl,
      deploymentVerified,
      deploymentAutoDetected: autoDetected,
      allDeploymentUrls: repoInfo.deploymentUrls,
      verificationDetails,
      repoDescription: repoInfo.description,
      homepage: repoInfo.homepage
    }
  } catch (error: any) {
    console.error('❌ GitHub verification error:', error)
    return {
      success: false,
      error: error.message || 'Verification failed'
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { githubUrl, deploymentUrl: rawDeploymentUrl } = await request.json()

    if (!githubUrl) {
      return NextResponse.json(
        { error: 'GitHub URL is required' },
        { status: 400 }
      )
    }

    // Filter out the problePOL deployment URL if it's provided in the request
    const deploymentUrl = rawDeploymentUrl === PROBLEPOL_DEPLOYMENT_URL ? undefined : rawDeploymentUrl;

    const result = await verifyGitHubRepository(githubUrl, deploymentUrl)

    if (!result.success) {
      console.error('GitHub verification failed:', result.error);
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Verification failed' },
      { status: 500 }
    )
  }
}