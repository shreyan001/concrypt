import { NextRequest, NextResponse } from 'next/server';
import { FilecoinStorageService } from '@/lib/filecoinStorageService';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import os from 'os';

export async function POST(request: NextRequest) {
  try {
    const { cid } = await request.json();

    if (!cid) {
      return NextResponse.json(
        { error: 'CID is required' },
        { status: 400 }
      );
    }

    // Create a temporary directory for the download
    const tempDir = path.join(os.tmpdir(), 'Pakt-downloads');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Generate a unique filename
    const uniqueId = uuidv4();
    const outputPath = path.join(tempDir, `${uniqueId}.zip`);

    // Initialize Filecoin Storage service
    const storageService = new FilecoinStorageService();

    // Download the file
    const downloadResult = await storageService.downloadFile(cid, outputPath);

    if (!downloadResult.success) {
      return NextResponse.json(
        { error: downloadResult.error || 'Download failed' },
        { status: 500 }
      );
    }

    // Read the file as a buffer
    const fileBuffer = fs.readFileSync(outputPath);

    // Clean up the temporary file
    fs.unlinkSync(outputPath);

    // Return the file as a response (convert Buffer to ArrayBuffer)
    return new NextResponse(new Uint8Array(fileBuffer).buffer, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': 'attachment; filename="project-files.zip"',
      },
    });
  } catch (error: any) {
    console.error('Download API error:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}