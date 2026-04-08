import { NextRequest, NextResponse } from 'next/server';
import { verifyRepoDeployment, verifyDeploymentFromUrl, parseGitHubUrl, getRepoInfo, getRepoInfoFromUrl } from '@/lib/github/verifyDeployment';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Log the request for debugging
    console.log('MCP Verification Request:', body);
    
    // Validate required fields
    const { deployedUrl, fileToCheck = 'package.json', branch = 'main', githubUrl } = body;
    
    // If only githubUrl is provided, return repository info with deployment URLs
    if (githubUrl && !deployedUrl) {
      try {
        const repoInfo = await getRepoInfoFromUrl(githubUrl, branch);
        return NextResponse.json({
          success: true,
          data: {
            type: 'repository_info',
            ...repoInfo
          },
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Repository Info Error:', error);
        return NextResponse.json(
          {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get repository info',
            timestamp: new Date().toISOString()
          },
          { status: 500 }
        );
      }
    }
    
    if (!deployedUrl) {
      return NextResponse.json(
        { error: 'deployedUrl is required for deployment verification' },
        { status: 400 }
      );
    }
    
    let result;
    
    // Check if we have a GitHub URL or owner/repo separately
    if (body.repoUrl) {
      // Use the convenience function with GitHub URL
      result = await verifyDeploymentFromUrl({
        repoUrl: body.repoUrl,
        branch,
        deployedUrl,
        fileToCheck
      });
    } else if (body.owner && body.repo) {
      // Use owner/repo directly
      result = await verifyRepoDeployment({
        owner: body.owner,
        repo: body.repo,
        branch,
        deployedUrl,
        fileToCheck
      });
    } else {
      return NextResponse.json(
        { error: 'Either repoUrl or both owner and repo are required' },
        { status: 400 }
      );
    }
    
    // Return the verification result
    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('MCP Verification Error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  // Support GET requests with query parameters for simple testing
  const owner = searchParams.get('owner');
  const repo = searchParams.get('repo');
  const repoUrl = searchParams.get('repoUrl');
  const deployedUrl = searchParams.get('deployedUrl');
  const branch = searchParams.get('branch') || 'main';
  const fileToCheck = searchParams.get('fileToCheck') || 'package.json';
  
  if (!deployedUrl) {
    return NextResponse.json(
      { error: 'deployedUrl parameter is required' },
      { status: 400 }
    );
  }
  
  try {
    let result;
    
    if (repoUrl) {
      result = await verifyDeploymentFromUrl({
        repoUrl,
        branch,
        deployedUrl,
        fileToCheck
      });
    } else if (owner && repo) {
      result = await verifyRepoDeployment({
        owner,
        repo,
        branch,
        deployedUrl,
        fileToCheck
      });
    } else {
      return NextResponse.json(
        { error: 'Either repoUrl or both owner and repo parameters are required' },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('MCP Verification Error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// OPTIONS method for CORS support
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}