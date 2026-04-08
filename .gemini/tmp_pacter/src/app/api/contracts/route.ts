"use server";
import { NextRequest, NextResponse } from "next/server";
import { RedisService, DeployedContract } from "@/lib/redisService";

// GET - Retrieve all deployed contracts or a specific contract by ID
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contractId = searchParams.get("id");

    console.log("API GET request:", {
      requestedContractId: contractId,
      timestamp: new Date().toISOString(),
    });

    if (contractId) {
      const contract = await RedisService.getContractById(contractId);

      if (!contract) {
        console.log("Contract not found in Redis:", contractId);
        return NextResponse.json(
          {
            error: "Contract not found",
            message: "Contract not found in Redis database",
          },
          { status: 404 }
        );
      }

      console.log("Contract found and returning:", contract.id);
      return NextResponse.json(contract);
    }

    const allContracts = await RedisService.getAllContracts();
    console.log("Returning all contracts, count:", allContracts.length);
    return NextResponse.json(allContracts);
  } catch (error) {
    console.error("Error reading contracts from Redis:", error);
    return NextResponse.json(
      { error: "Failed to read contracts" },
      { status: 500 }
    );
  }
}

// POST - Store a new contract (supports both old and new format)
export async function POST(request: NextRequest) {
  try {
    console.log("POST /api/contracts - Starting contract storage");

    // Parse request body
    let contractData: any;
    try {
      contractData = await request.json();
      console.log(
        "Contract data received:",
        JSON.stringify(contractData, null, 2)
      );
    } catch (parseError) {
      console.error("Error parsing request JSON:", parseError);
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    // Check if this is the new contract format (has parties, escrow, etc.)
    const isNewFormat = contractData.parties && contractData.escrow && contractData.projectDetails;

    if (isNewFormat) {
      // New format - save directly to database
      console.log("Detected new contract format");
      
      // Validate required fields for new format
      if (!contractData.id || !contractData.name || !contractData.parties) {
        return NextResponse.json(
          { error: "Missing required fields for new contract format" },
          { status: 400 }
        );
      }

      // Get current database
      const database = await RedisService.getDatabase();
      
      // Check if contract already exists
      const existingIndex = database.contracts.findIndex((c: any) => c.id === contractData.id);
      if (existingIndex !== -1) {
        console.log("Contract already exists, updating...");
        database.contracts[existingIndex] = contractData;
      } else {
        console.log("Adding new contract to database");
        database.contracts.push(contractData);
      }
      
      // Save updated database
      const success = await RedisService.setDatabase(database);
      
      if (!success) {
        console.error("Failed to store contract in Redis");
        return NextResponse.json(
          { error: "Failed to store contract in Redis" },
          { status: 500 }
        );
      }

      console.log("Contract storage completed successfully");
      return NextResponse.json(
        { success: true, contract: contractData },
        { status: 201 }
      );
    } else {
      // Old format - use existing logic
      console.log("Detected old contract format");
      
      // Validate required fields
      if (
        !contractData.name ||
        !contractData.contractAddress ||
        !contractData.partyA
      ) {
        console.error("Missing required fields:", {
          name: contractData.name,
          contractAddress: contractData.contractAddress,
          partyA: contractData.partyA,
        });
        return NextResponse.json(
          { error: "Missing required fields: name, contractAddress, or partyA" },
          { status: 400 }
        );
      }

      // Generate unique ID
      const contractId = `${contractData.name
        .toLowerCase()
        .replace(/\s+/g, "-")}-${Date.now()}`;
      console.log("Generated contract ID:", contractId);

      const newContract: DeployedContract = {
        id: contractId,
        ...contractData,
        deployedAt: new Date().toISOString(),
        partyASignatureStatus: false,
        partyBSignatureStatus: false,
      };

      console.log("New contract object:", JSON.stringify(newContract, null, 2));

      // Add contract to Redis
      const success = await RedisService.addContract(newContract);

      if (!success) {
        console.error("Failed to store contract in Redis");
        return NextResponse.json(
          { error: "Failed to store contract in Redis" },
          { status: 500 }
        );
      }

      console.log("Contract storage completed successfully");
      return NextResponse.json(
        { success: true, contract: newContract },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error("Unexpected error in POST /api/contracts:", error);
    return NextResponse.json(
      {
        error: "Failed to store contract",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// PUT - Update an existing contract
export async function PUT(request: NextRequest) {
  try {
    const updateData = await request.json();
    const contractId = updateData.id;

    if (!contractId) {
      return NextResponse.json(
        { error: "Contract ID is required" },
        { status: 400 }
      );
    }

    console.log("PUT /api/contracts - Updating contract:", contractId);

    // Get current database
    const database = await RedisService.getDatabase();
    
    // Find contract index
    const contractIndex = database.contracts.findIndex((c: any) => c.id === contractId);
    
    if (contractIndex === -1) {
      return NextResponse.json(
        { error: "Contract not found" },
        { status: 404 }
      );
    }

    // Update contract (merge with existing data)
    database.contracts[contractIndex] = {
      ...database.contracts[contractIndex],
      ...updateData,
      lastUpdated: new Date().toISOString()
    };

    // Save updated database
    const success = await RedisService.setDatabase(database);

    if (!success) {
      return NextResponse.json(
        { error: "Failed to update contract" },
        { status: 500 }
      );
    }

    console.log("Contract updated successfully in Redis");
    return NextResponse.json({ 
      success: true, 
      contract: database.contracts[contractIndex] 
    });
  } catch (error) {
    console.error("Error updating contract:", error);
    return NextResponse.json(
      { error: "Failed to update contract" },
      { status: 500 }
    );
  }
}

// PATCH - Update signature status for a specific party
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contractId = searchParams.get("id");

    if (!contractId) {
      return NextResponse.json(
        { error: "Contract ID is required" },
        { status: 400 }
      );
    }

    const { party, address, signature, signatureStatus } = await request.json();

    if (!party || !["A", "B"].includes(party)) {
      return NextResponse.json(
        { error: "Valid party (A or B) is required" },
        { status: 400 }
      );
    }

    // Update signature status in Redis
    const updatedContract = await RedisService.updateSignatureStatus(
      contractId,
      party as "A" | "B",
      { address, signature, signatureStatus }
    );

    if (!updatedContract) {
      return NextResponse.json(
        { error: "Contract not found" },
        { status: 404 }
      );
    }

    console.log("Contract signature updated successfully in Redis");
    return NextResponse.json({ success: true, contract: updatedContract });
  } catch (error) {
    console.error("Error updating signature status:", error);
    return NextResponse.json(
      { error: "Failed to update signature status" },
      { status: 500 }
    );
  }
}

// DELETE - Remove a contract
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contractId = searchParams.get("id");

    if (!contractId) {
      return NextResponse.json(
        { error: "Contract ID is required" },
        { status: 400 }
      );
    }

    // Delete contract from Redis
    const deletedContract = await RedisService.deleteContract(contractId);

    if (!deletedContract) {
      return NextResponse.json(
        { error: "Contract not found" },
        { status: 404 }
      );
    }

    console.log("Contract deleted successfully from Redis");
    return NextResponse.json({ success: true, deletedContract });
  } catch (error) {
    console.error("Error deleting contract:", error);
    return NextResponse.json(
      { error: "Failed to delete contract" },
      { status: 500 }
    );
  }
}
