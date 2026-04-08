// Step 2: Filebase IPFS Storage Upload
import { NextRequest, NextResponse } from 'next/server'
import { FilecoinStorageService } from '@/lib/filecoinStorageService'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

async function uploadCodeToFilecoin(codeContent: string, metadata: any) {
  try {
    console.log('📤 Starting Filebase IPFS storage upload for code content...')

    // Create temporary directory for code files
    const tempDir = path.join(os.tmpdir(), `Pakt_upload_${Date.now()}`)
    fs.mkdirSync(tempDir, { recursive: true })

    // Create metadata file
    const metadataFilePath = path.join(tempDir, 'metadata.json')
    fs.writeFileSync(metadataFilePath, JSON.stringify(metadata, null, 2))

    // Create code file
    const codeFilePath = path.join(tempDir, 'code.js')
    fs.writeFileSync(codeFilePath, codeContent)

    console.log('📝 Temporary files created in:', tempDir)

    try {
      // Initialize Filecoin Storage Service
      const storageService = new FilecoinStorageService()

      if (!storageService.isConfigured()) {
        console.warn('⚠️ Filebase storage not configured, returning mock result')
        fs.rmSync(tempDir, { recursive: true, force: true })
        return {
          success: true,
          cid: 'mock_cid_' + Date.now(),
          url: null,
          note: 'Storage not configured - using mock CID'
        }
      }

      console.log('🔗 Connected to Filebase IPFS storage')

      // Upload folder to Filecoin Storage
      const uploadResult = await storageService.uploadFolder(tempDir)

      // Clean up temp directory
      fs.rmSync(tempDir, { recursive: true, force: true })

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Upload failed')
      }

      console.log('✅ Upload successful!')
      console.log(`📋 Uploaded folder with CID: ${uploadResult.cid}`)

      return {
        success: true,
        cid: uploadResult.cid,
        url: uploadResult.url
      }
    } catch (uploadError: any) {
      // Clean up temp directory on error
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true })
      }
      throw uploadError
    }
  } catch (error: any) {
    console.error('❌ Storage upload error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { codeContent, metadata } = await request.json()

    if (!codeContent) {
      return NextResponse.json(
        { error: 'Code content is required' },
        { status: 400 }
      )
    }

    // Use provided metadata or create default
    const uploadMetadata = metadata || {
      uploadedAt: new Date().toISOString(),
      verificationAgent: 'Pakt-AI-Agent',
      contractType: 'Pakt-Escrow-Contract',
      version: '1.0.0'
    }

    const result = await uploadCodeToFilecoin(codeContent, uploadMetadata)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({ cid: result.cid, url: result.url })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Storage upload failed' },
      { status: 500 }
    )
  }
}
