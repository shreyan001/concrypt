// Download files from Filebase IPFS Storage
import { NextRequest, NextResponse } from 'next/server'
import { FilecoinStorageService } from '@/lib/filecoinStorageService'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

export async function POST(request: NextRequest) {
  try {
    const { cid } = await request.json()

    if (!cid) {
      return NextResponse.json(
        { error: 'CID is required' },
        { status: 400 }
      )
    }

    console.log('📥 Downloading from Filebase IPFS:', cid)

    // Initialize Filecoin Storage Service
    const storageService = new FilecoinStorageService()

    // Create temp download path
    const tempDir = os.tmpdir()
    const downloadPath = path.join(tempDir, `Pakt_download_${Date.now()}.json`)

    // Download file
    const downloadResult = await storageService.downloadFile(cid, downloadPath)

    if (!downloadResult.success) {
      return NextResponse.json(
        { error: downloadResult.error || 'Download failed' },
        { status: 500 }
      )
    }

    // Read the downloaded file
    const fileContent = fs.readFileSync(downloadPath, 'utf-8')
    const metadata = JSON.parse(fileContent)

    // Clean up temp file
    fs.unlinkSync(downloadPath)

    console.log('✅ Download successful!')

    return NextResponse.json({
      success: true,
      metadata,
      cid
    })
  } catch (error: any) {
    console.error('❌ Download error:', error)
    return NextResponse.json(
      { error: error.message || 'Download failed' },
      { status: 500 }
    )
  }
}
