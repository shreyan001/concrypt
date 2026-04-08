import { Redis } from '@upstash/redis';

// Redis configuration
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Database key for storing all contract data
const DATABASE_KEY = 'database';

// Interface for deployed contracts (matching existing structure)
export interface DeployedContract {
  id: string;
  name: string;
  contractAddress: string;
  abi: any[];
  bytecode: string;
  contractType: string;
  partyA: string;
  partyB?: string;
  deployedAt: string;
  transactionHash?: string;
  networkId?: string;
  description?: string;
  partyASignatureStatus?: boolean;
  partyBSignatureStatus?: boolean;
  partyAAddress?: string;
  partyBAddress?: string;
  partyASignature?: string;
  partyBSignature?: string;
}

// Database structure
export interface DatabaseStructure {
  contracts: DeployedContract[];
}

/**
 * Redis Service Class
 * Provides simple GET/SET operations for JSON data storage
 */
export class RedisService {
  /**
   * Retrieve the entire database JSON object
   */
  static async getDatabase(): Promise<DatabaseStructure> {
    try {
      const data = await redis.get(DATABASE_KEY);
      
      // If no data exists, return empty structure
      if (!data) {
        const emptyDatabase: DatabaseStructure = { contracts: [] };
        await this.setDatabase(emptyDatabase);
        return emptyDatabase;
      }
      
      return data as DatabaseStructure;
    } catch (error) {
      console.error('Error retrieving database from Redis:', error);
      // Return empty structure on error
      return { contracts: [] };
    }
  }

  /**
   * Store the entire database JSON object
   */
  static async setDatabase(database: DatabaseStructure): Promise<boolean> {
    try {
      await redis.set(DATABASE_KEY, database);
      return true;
    } catch (error) {
      console.error('Error storing database to Redis:', error);
      return false;
    }
  }

  /**
   * Get all contracts
   */
  static async getAllContracts(): Promise<DeployedContract[]> {
    const database = await this.getDatabase();
    return database.contracts;
  }

  /**
   * Get a specific contract by ID
   */
  static async getContractById(id: string): Promise<DeployedContract | null> {
    const database = await this.getDatabase();
    return database.contracts.find(contract => contract.id === id) || null;
  }

  /**
   * Add a new contract
   */
  static async addContract(contract: DeployedContract): Promise<boolean> {
    try {
      const database = await this.getDatabase();
      
      // Check if contract with same ID already exists
      const existingIndex = database.contracts.findIndex(c => c.id === contract.id);
      if (existingIndex !== -1) {
        throw new Error(`Contract with ID ${contract.id} already exists`);
      }
      
      // Add new contract
      database.contracts.push(contract);
      
      // Store updated database
      return await this.setDatabase(database);
    } catch (error) {
      console.error('Error adding contract:', error);
      return false;
    }
  }

  /**
   * Update an existing contract
   */
  static async updateContract(id: string, updates: Partial<DeployedContract>): Promise<DeployedContract | null> {
    try {
      const database = await this.getDatabase();
      
      // Find contract index
      const contractIndex = database.contracts.findIndex(c => c.id === id);
      if (contractIndex === -1) {
        return null;
      }
      
      // Update contract
      database.contracts[contractIndex] = {
        ...database.contracts[contractIndex],
        ...updates
      };
      
      // Store updated database
      const success = await this.setDatabase(database);
      if (!success) {
        return null;
      }
      
      return database.contracts[contractIndex];
    } catch (error) {
      console.error('Error updating contract:', error);
      return null;
    }
  }

  /**
   * Delete a contract
   */
  static async deleteContract(id: string): Promise<DeployedContract | null> {
    try {
      const database = await this.getDatabase();
      
      // Find contract index
      const contractIndex = database.contracts.findIndex(c => c.id === id);
      if (contractIndex === -1) {
        return null;
      }
      
      // Remove contract
      const deletedContract = database.contracts.splice(contractIndex, 1)[0];
      
      // Store updated database
      const success = await this.setDatabase(database);
      if (!success) {
        return null;
      }
      
      return deletedContract;
    } catch (error) {
      console.error('Error deleting contract:', error);
      return null;
    }
  }

  /**
   * Sync contracts from client (replace all contracts)
   */
  static async syncContracts(contracts: DeployedContract[]): Promise<boolean> {
    try {
      const database: DatabaseStructure = { contracts };
      return await this.setDatabase(database);
    } catch (error) {
      console.error('Error syncing contracts:', error);
      return false;
    }
  }

  /**
   * Update signature status for a specific party
   */
  static async updateSignatureStatus(
    contractId: string,
    party: 'A' | 'B',
    signatureData: {
      address?: string;
      signature?: string;
      signatureStatus: boolean;
    }
  ): Promise<DeployedContract | null> {
    try {
      const database = await this.getDatabase();
      
      // Find contract index
      const contractIndex = database.contracts.findIndex(c => c.id === contractId);
      if (contractIndex === -1) {
        return null;
      }
      
      // Prepare update fields
      const updateFields: Partial<DeployedContract> = {};
      
      if (party === 'A') {
        updateFields.partyASignatureStatus = signatureData.signatureStatus;
        if (signatureData.address) updateFields.partyAAddress = signatureData.address;
        if (signatureData.signature) updateFields.partyASignature = signatureData.signature;
      } else {
        updateFields.partyBSignatureStatus = signatureData.signatureStatus;
        if (signatureData.address) updateFields.partyBAddress = signatureData.address;
        if (signatureData.signature) updateFields.partyBSignature = signatureData.signature;
        if (signatureData.address && !database.contracts[contractIndex].partyB) {
          updateFields.partyB = signatureData.address;
        }
      }
      
      // Update contract
      database.contracts[contractIndex] = {
        ...database.contracts[contractIndex],
        ...updateFields
      };
      
      // Store updated database
      const success = await this.setDatabase(database);
      if (!success) {
        return null;
      }
      
      return database.contracts[contractIndex];
    } catch (error) {
      console.error('Error updating signature status:', error);
      return null;
    }
  }
}