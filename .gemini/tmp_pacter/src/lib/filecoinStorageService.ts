import { ObjectManager, BucketManager } from '@filebase/sdk';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Filebase IPFS Storage Service
 * 
 * This service provides decentralized storage functionality on IPFS
 * via Filebase's S3-compatible API with native folder upload support.
 */

export interface UploadResult {
    success: boolean;
    cid?: string; // Content Identifier (IPFS hash)
    url?: string; // Gateway URL to access the file
    error?: string;
}

export interface FolderUploadResult {
    success: boolean;
    cid?: string;
    url?: string;
    error?: string;
}

export interface DownloadResult {
    success: boolean;
    filePath?: string;
    error?: string;
}

export interface FileInfo {
    cid: string;
    size?: number;
    created?: string;
}

/**
 * FilecoinStorageService (now using Filebase)
 * 
 * Provides upload/download functionality using Filebase IPFS pinning
 * 
 * Environment variables required:
 * - FILEBASE_S3_KEY: S3 access key from Filebase
 * - FILEBASE_S3_SECRET: S3 secret key from Filebase
 * - FILEBASE_BUCKET_NAME: Your Filebase bucket name
 * - FILEBASE_GATEWAY_URL: IPFS gateway URL (optional)
 */
export class FilecoinStorageService {
    private s3Key: string;
    private s3Secret: string;
    private bucketName: string;
    private gatewayUrl: string;
    private objectManager: ObjectManager | null = null;
    private bucketManager: BucketManager | null = null;

    constructor() {
        this.s3Key = process.env.FILEBASE_S3_KEY || '';
        this.s3Secret = process.env.FILEBASE_S3_SECRET || '';
        this.bucketName = process.env.FILEBASE_BUCKET_NAME || 'pakt-contracts';
        this.gatewayUrl = process.env.FILEBASE_GATEWAY_URL || 'https://ipfs.filebase.io/ipfs';

        if (!this.s3Key || !this.s3Secret) {
            console.warn('Filebase credentials not set - storage features will be disabled');
        } else {
            try {
                this.bucketManager = new BucketManager(this.s3Key, this.s3Secret);
                this.objectManager = new ObjectManager(this.s3Key, this.s3Secret, {
                    bucket: this.bucketName
                });
            } catch (error) {
                console.error('Failed to initialize Filebase managers:', error);
            }
        }
    }

    /**
     * Check if the service is properly configured
     */
    isConfigured(): boolean {
        return !!(this.s3Key && this.s3Secret && this.objectManager);
    }

    /**
     * Ensure bucket exists, create if it doesn't
     */
    private async ensureBucket(): Promise<void> {
        if (!this.bucketManager) {
            throw new Error('BucketManager not initialized');
        }

        try {
            // Try to list buckets to check if our bucket exists
            const buckets = await this.bucketManager.list();
            const bucketExists = buckets.some((b: any) => b.Name === this.bucketName);

            if (!bucketExists) {
                console.log(`Creating bucket: ${this.bucketName}`);
                await this.bucketManager.create(this.bucketName);
            }
        } catch (error) {
            // If listing fails, try to create anyway (it will fail gracefully if exists)
            try {
                await this.bucketManager.create(this.bucketName);
            } catch (createError) {
                // Bucket might already exist, continue
                console.log('Bucket creation skipped (may already exist)');
            }
        }
    }

    /**
     * Upload a file to IPFS via Filebase
     */
    async uploadFile(filePath: string): Promise<UploadResult> {
        if (!this.isConfigured()) {
            return { success: false, error: 'Storage service not configured - missing Filebase credentials' };
        }

        try {
            // Read file
            if (!fs.existsSync(filePath)) {
                return { success: false, error: `File not found: ${filePath}` };
            }

            await this.ensureBucket();

            const fileContent = fs.readFileSync(filePath);
            const fileName = path.basename(filePath);

            // Upload to Filebase - the SDK expects Buffer or string
            const uploadedObject: any = await this.objectManager!.upload(fileName, fileContent, {}, {});

            // The uploadedObject should have a cid property
            const cid = uploadedObject.cid || uploadedObject.CID || uploadedObject;

            if (!cid) {
                throw new Error('Upload succeeded but no CID returned');
            }

            return {
                success: true,
                cid: typeof cid === 'string' ? cid : cid.toString(),
                url: `${this.gatewayUrl}/${typeof cid === 'string' ? cid : cid.toString()}`,
            };
        } catch (error) {
            console.error('Upload error:', error);
            return { success: false, error: `Upload failed: ${error}` };
        }
    }

    /**
     * Upload a folder to IPFS via Filebase
     * Filebase supports native folder uploads without zipping
     */
    async uploadFolder(folderPath: string): Promise<FolderUploadResult> {
        if (!this.isConfigured()) {
            return { success: false, error: 'Storage service not configured - missing Filebase credentials' };
        }

        try {
            // Check if folder exists
            if (!fs.existsSync(folderPath) || !fs.statSync(folderPath).isDirectory()) {
                return { success: false, error: `Folder not found: ${folderPath}` };
            }

            await this.ensureBucket();

            // Read all files in the folder recursively
            const files = this.getAllFiles(folderPath);

            if (files.length === 0) {
                return { success: false, error: 'No files found in folder' };
            }

            // Create a unique folder name based on timestamp
            const folderName = `folder_${Date.now()}`;

            // Upload each file with folder structure preserved
            let lastCid = '';
            for (const file of files) {
                const relativePath = path.relative(folderPath, file);
                const objectKey = `${folderName}/${relativePath.replace(/\\/g, '/')}`;
                const fileContent = fs.readFileSync(file);

                const uploadedObject: any = await this.objectManager!.upload(objectKey, fileContent, {}, {});

                // Extract CID from response
                const cid = uploadedObject.cid || uploadedObject.CID || uploadedObject;
                lastCid = typeof cid === 'string' ? cid : cid.toString();
            }

            // The CID of the folder will be from the last upload
            // In practice, you might want to track the root folder CID differently
            return {
                success: true,
                cid: lastCid,
                url: `${this.gatewayUrl}/${lastCid}`,
            };
        } catch (error) {
            console.error('Folder upload error:', error);
            return { success: false, error: `Folder upload failed: ${error}` };
        }
    }

    /**
     * Recursively get all files in a directory
     */
    private getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
        const files = fs.readdirSync(dirPath);

        files.forEach((file) => {
            const filePath = path.join(dirPath, file);
            if (fs.statSync(filePath).isDirectory()) {
                arrayOfFiles = this.getAllFiles(filePath, arrayOfFiles);
            } else {
                arrayOfFiles.push(filePath);
            }
        });

        return arrayOfFiles;
    }

    /**
     * Download a file from IPFS using CID
     */
    async downloadFile(cid: string, outputPath: string): Promise<DownloadResult> {
        try {
            const url = `${this.gatewayUrl}/${cid}`;

            const response = await fetch(url);
            if (!response.ok) {
                return { success: false, error: `Download failed: ${response.statusText}` };
            }

            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            // Ensure output directory exists
            const outputDir = path.dirname(outputPath);
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }

            fs.writeFileSync(outputPath, buffer);

            return { success: true, filePath: outputPath };
        } catch (error) {
            console.error('Download error:', error);
            return { success: false, error: `Download failed: ${error}` };
        }
    }

    /**
     * Get the gateway URL for a CID
     */
    getGatewayUrl(cid: string): string {
        return `${this.gatewayUrl}/${cid}`;
    }
}

// Export singleton instance
export const filecoinStorage = new FilecoinStorageService();
