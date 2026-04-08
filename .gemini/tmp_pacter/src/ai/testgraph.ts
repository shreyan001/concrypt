import { StateGraph } from "@langchain/langgraph";
import { BaseMessage, AIMessage, HumanMessage } from "@langchain/core/messages";
import { START, END } from "@langchain/langgraph";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { ChatGroq } from "@langchain/groq";
import { z } from "zod";

const model = new ChatGroq({
    modelName: "llama-3.3-70b-versatile",
    temperature: 0.7,
    apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY,
});

// **Zod Schema for Information Extraction**
export const UserInputExtractionSchema = z.object({
    extractedInfo: z.object({
        projectName: z.string().nullable().describe("Name of the project/website"),
        projectDescription: z.string().nullable().describe("Description of what needs to be built"),
        clientName: z.string().nullable().describe("Name of the client/company"),
        paymentAmount: z.number().nullable().describe("Payment amount in INR"),
        // walletAddress removed - it comes from connected wallet only, not user input
        email: z.string().nullable().describe("Client email address"),
        timeline: z.string().nullable().describe("Project timeline"),
        deliverables: z.array(z.string()).nullable().describe("Project deliverables"),
        escrowType: z.string().nullable().describe("Preferred escrow or contract type such as milestone, time_locked, arbitration_enabled, or api_rental"),
        arbitrationPreference: z.string().nullable().describe("Arbitration preferences including desire for escalation partners"),
        arbitrationContract: z.string().nullable().describe("Arbitration contract address or identifier"),
        serviceDuration: z.string().nullable().describe("Duration or schedule for time-locked or streaming services"),
        apiEndpoint: z.string().nullable().describe("API endpoint or service URL that requires monitoring"),
        uptimeSLA: z.string().nullable().describe("Desired uptime or latency SLA for monitored services"),
        vaultOptIn: z.union([z.string(), z.boolean()]).nullable().describe("Preference for routing escrow funds through the insured DeFi vault with 1 percent yield")
    }),
    completionStatus: z.object({
        isComplete: z.boolean().describe("Whether all required information is collected"),
        hasProjectName: z.boolean().describe("Whether project name is provided"),
        hasProjectDescription: z.boolean().describe("Whether project description is provided"),
        hasClientName: z.boolean().describe("Whether client name is provided"),
        hasPaymentAmount: z.boolean().describe("Whether payment amount is provided"),
        hasWalletAddress: z.boolean().describe("Whether wallet address is provided"),
        hasEmail: z.boolean().describe("Whether email is provided")
    })
});

// **State Type Definition**
type ProjectState = {
    input: string,
    contractData?: any | null,
    chatHistory?: BaseMessage[],
    messages?: any[] | null,
    operation?: string,
    result?: string,
    walletAddress?: string,
    // Enhanced stage management for conversation flow
    stage?: 'initial' | 'information_collection' | 'data_ready' | 'completed',
    information_collection?: boolean,
    // Progress tracking for frontend synchronization
    progress?: number, // 0-100 percentage
    stageIndex?: number, // Current stage index for frontend
    currentFlowStage?: string, // Current flow stage name
    isStageComplete?: boolean, // Whether current stage is complete
    stageData?: any, // Data for current stage
    validationErrors?: string[], // Validation errors for frontend
    formData?: any, // Form data for frontend
    // Information collection tracking
    collectedFields?: {
        projectName?: boolean,
        projectDescription?: boolean,
        clientName?: boolean,
        email?: boolean,
        walletAddress?: boolean,
        paymentAmount?: boolean,
        escrowType?: boolean,
        arbitrationPreference?: boolean,
        arbitrationContract?: boolean,
        serviceDuration?: boolean,
        apiEndpoint?: boolean,
        uptimeSLA?: boolean,
        vaultOptIn?: boolean,
    },
    // Project information
    projectInfo?: {
        projectName?: string,
        projectDescription?: string,
        deliverables?: string[],
        timeline?: string,
        requirements?: string,
        revisions?: number,
    },
    clientInfo?: {
        clientName?: string,
        walletAddress?: string,
        email?: string,
    },
    financialInfo?: {
        paymentAmount?: number, // Payment in INR
        platformFees?: number, // Platform fees in INR
        escrowFee?: number, // Escrow service fee in INR
        totalEscrowAmount?: number, // Total amount in INR
        currency?: string, // Currency (INR)
        polEquivalent?: number, // Equivalent in POL tokens
    },
    contractOptions?: {
        escrowType?: string,
        arbitrationPreference?: string,
        arbitrationContract?: string,
        vaultOptIn?: string | boolean,
    },
    serviceMonitoring?: {
        serviceDuration?: string,
        apiEndpoint?: string,
        uptimeSLA?: string,
    },
    dataReady?: boolean,
    // Polygon Integration
    inferenceReady?: boolean, // Signal that data is ready for secure processing
    collectedData?: any, // Complete collected data
}

export default function nodegraph() {
    const graph = new StateGraph<ProjectState>({
        channels: {
            messages: { value: (x: any[], y: any[]) => x.concat(y) },
            input: { value: null },
            result: { value: null },
            contractData: { value: null },
            chatHistory: { value: null },
            operation: { value: null },
            walletAddress: { value: null },
            stage: { value: null },
            information_collection: { value: null },
            progress: { value: null },
            stageIndex: { value: null },
            currentFlowStage: { value: null },
            isStageComplete: { value: null },
            stageData: { value: null },
            validationErrors: { value: null },
            formData: { value: null },
            collectedFields: { value: null },
            projectInfo: { value: null },
            clientInfo: { value: null },
            financialInfo: { value: null },
            contractOptions: { value: null },
            serviceMonitoring: { value: null },
            dataReady: { value: null },
            // Polygon Integration
            inferenceReady: { value: null },
            collectedData: { value: null }
        }
    });

    // Initial Node: Provides comprehensive project information and routes user requests
    graph.addNode("initial_node", async (state: ProjectState) => {
        const INITIAL_SYSTEM_TEMPLATE = `You are Pakt AI, an intelligent assistant for Pakt - a secure escrow system for freelance project development.

## About Pakt
Pakt is a **trustless escrow platform** that enables secure transactions between clients and freelancers for project development. Built on:

🔗 **Secure Escrow System** - Protected payment holding using POL blockchain
⚡ **Smart Contract Integration** - Automated contract execution  
💰 **INR payments with POL tokens** - All payments collected in INR and executed using POL token equivalents
🤖 **Automated verification** - Payment release system
🛡️ **Dual Protection** - Guards against non-payment AND non-delivery

## Key Features & Benefits
✅ **Trustless Security** - Payments held in escrow until work completion
✅ **Vault Yield Routing** - Optional insured DeFi vault with 1% bonus on idle balances
🤝 **Arbitration Network** - On-chain arbitration partners for escalations
📋 **Milestone Tracking** - Automated verification and progress monitoring  
📁 **Secure Delivery** - Protected file delivery and project management
🌐 **Project Types** - Websites, mobile apps, software development, design work, etc.

## How It Works
1. **Client deposits** payment into secure escrow (in INR, executed as POL tokens)
2. **Freelancer builds** the project according to specifications
3. **Automated verification** checks deliverables against requirements
4. **Payment releases** automatically when milestones are met
5. **Dispute resolution** available if needed

## Classification Guidelines

**For GREETINGS & GENERAL QUESTIONS**: 
Provide detailed, helpful information about Pakt, how it works, benefits, and encourage them to explore our escrow services. Be warm, informative, and educational.

**For ESCROW INTEREST**: 
If user wants to create an escrow, hire a freelancer, or start a project:
1. Acknowledge their interest
2. If wallet is connected ({wallet_address}), acknowledge it with a checkmark
3. Explain that you'll collect the core project details plus vault, arbitration, or monitoring preferences when relevant
4. Start by asking for the FIRST missing piece (usually project name)
5. Be clear and specific about what you need

## Example Responses:

**Example 1 - User wants to create escrow (with wallet):**
User: "I want to hire a freelancer"
You: "Great! I'll help you set up a secure escrow for your project.
✅ Wallet Address: {wallet_address}

Let's start with the basics. What would you like to call this project? (e.g., 'E-commerce Website', 'Mobile App Development') [INTENT:ESCROW]"

**Example 2 - User says "I am a client" (with wallet):**
User: "I am a client"
You: "Perfect! I'll help you create an escrow for your project.
✅ Wallet Address: {wallet_address}

First, what's the project name? (e.g., 'Website Redesign', 'Mobile App') [INTENT:ESCROW]"

**Example 3 - General question:**
User: "What is Pakt?"
You: "Pakt is a trustless escrow platform... [detailed explanation] [INTENT:GENERAL]"

Current conversation stage: {stage}
Connected Wallet: {wallet_address}

**Response Style**: Be warm, professional, and comprehensive. For general questions, provide detailed explanations. For escrow interest, be clear about the information collection process. ALWAYS acknowledge the connected wallet address with ✅ when starting escrow collection.

Always end your response with one of these hidden classification tags:
- [INTENT:ESCROW] - if user shows clear interest in creating escrow transactions
- [INTENT:GENERAL] - for greetings, general conversation, or information requests

**CRITICAL**: When starting escrow collection, immediately acknowledge the wallet address (if connected) and ask for the FIRST missing piece of information. Don't wait for the user to provide it voluntarily.`;

        const prompt = ChatPromptTemplate.fromMessages([
            ["system", INITIAL_SYSTEM_TEMPLATE],
            new MessagesPlaceholder({ variableName: "chat_history", optional: true }),
            ["human", "{input}"]
        ]);

        const response = await prompt.pipe(model).invoke({
            input: state.input,
            chat_history: state.chatHistory,
            stage: state.stage || 'initial',
            wallet_address: state.walletAddress || 'Not connected'
        });

        console.log(response.content, "Initial Node Response");

        const content = response.content as string;

        // Extract the intent classification from the response
        let operation = "end";  // Default to end
        let nextStage = 'initial';
        let progress = 0;
        let stageIndex = 0;

        if (content.includes("[INTENT:ESCROW]")) {
            operation = "collect_initiator_info";
            nextStage = 'information_collection';
            progress = 10;
            stageIndex = 1;
        }

        // Clean the response by removing the intent tag before returning to user
        const cleanedContent = content.replace(/\[INTENT:(ESCROW|GENERAL)\]/g, '').trim();

        return {
            result: cleanedContent,
            messages: [cleanedContent],
            operation: operation,
            stage: nextStage,
            information_collection: operation === "collect_initiator_info",
            progress: progress,
            stageIndex: stageIndex,
            currentFlowStage: nextStage === 'information_collection' ? 'Project Details Entered' : 'Identity Selected',
            isStageComplete: false,
            validationErrors: [],
            collectedFields: {
                projectName: false,
                projectDescription: false,
                clientName: false,
                email: false,
                walletAddress: !!state.walletAddress,
                paymentAmount: false,
                escrowType: false,
                arbitrationPreference: false,
                arbitrationContract: false,
                serviceDuration: false,
                apiEndpoint: false,
                uptimeSLA: false,
                vaultOptIn: false,
            }
        };
    });

    // Information Collection Node: SystePOLally collects all required project details
    graph.addNode("collect_initiator_info", async (state: ProjectState) => {
        const COLLECTION_SYSTEM_TEMPLATE = `You are Pakt AI's information collection specialist. Your role is to systePOLally gather the core escrow inputs and advanced service options needed for contract setup.

## CRITICAL RULES - READ CAREFULLY:
1. **NEVER ASSUME OR INVENT INFORMATION** - Only use what the user explicitly provides
2. **ONE QUESTION AT A TIME** - Ask for exactly ONE missing field per response
3. **EXTRACT ONLY FROM USER INPUT** - Parse the current user message for information
4. **NO DEFAULT VALUES** - Don't fill in missing information with placeholders or assumptions
5. **VALIDATE BEFORE STORING** - Only store information that was actually provided by the user
6. **NEVER EXTRACT WALLET ADDRESS** - Wallet addresses come from the connected wallet ONLY, not from user messages

## Required Information (Core Items):
1. **Project Name** - Clear, descriptive title (e.g., "E-commerce Website", "Mobile App")
2. **Project Description** - Detailed scope, what needs to be built (minimum 10 words)
3. **Client Name** - Full name of the person/company hiring (e.g., "John Doe", "Acme Corp")
4. **Email Address** - Valid email format (e.g., "john@example.com")
5. **Wallet Address** - POL blockchain wallet (automatically captured from connected wallet - DO NOT extract from messages)
6. **Payment Amount** - Total project cost in INR (numbers only, e.g., "50000")

## Advanced Options (Collect after core items are complete):
1. **Escrow Type / Service Mode** - Milestone, time-locked inference, arbitration-enabled, or standard escrow. For time-locked inference, capture the compute provider name and wallet, plus the agent address that will operate the stream.
2. **Arbitration Preference** - Desired arbitration partner and any contract address to route disputes
3. **Service Monitoring** - API endpoint, uptime or latency SLA, and subscription duration for compute rentals or GPU streaming
4. **Vault Opt-In** - Whether to route idle escrow balances through the insured DeFi vault with 1% bonus, and if yes, note any special yield split preferences

## Internal Collection Status (DO NOT SHOW TO USER):
{collection_status}

## Internal Previously Collected Information (DO NOT SHOW TO USER):
{collected_info}

## Connected Wallet Information:
Wallet Address: {wallet_address}

**IMPORTANT**: The collection status and collected info above are for YOUR REFERENCE ONLY. DO NOT display this raw data to the user. Instead, acknowledge what they provided in a natural, conversational way.

**WALLET ADDRESS NOTE**: The wallet address ({wallet_address}) is automatically captured from the user's connected wallet. You should NOT ask for it or mention it's missing if it shows as "Not connected" - the system handles this automatically.

## Collection Strategy:
- **ACKNOWLEDGE FIRST**: If user provided information, acknowledge it specifically
- **EXTRACT CAREFULLY**: Only extract information that is clearly stated in the user's message
- **ASK FOR NEXT**: Request the NEXT missing field with clear examples
- **BE SPECIFIC**: Give examples of what you're asking for
- **NEVER REPEAT**: Don't ask for information that's already collected
- **SKIP WALLET**: Never ask for wallet address - it's automatically captured

## Example Interactions:

**Example 1 - User says "I am a client":**
User: "I am a client"
You: "Great! I'll help you set up a secure escrow for your project. I need to collect a few details:

Let's start with the project name. What would you like to call this project? (e.g., 'E-commerce Website', 'Mobile App Development')"

**Example 2 - User provides project name:**
User: "Website Redesign"
You: "Perfect! ✅ Project Name: Website Redesign

Now, can you describe what needs to be built? Please provide details about the scope and requirements."

**Example 3 - User provides name and email:**
User: "I'm John Doe, email is john@example.com"
You: "Excellent! I've saved:
✅ Client Name: John Doe
✅ Email: john@example.com

What's the project name? (e.g., 'Mobile App Development', 'Website Redesign')"

**Example 4 - User provides payment amount:**
User: "The budget is 50000 rupees"
You: "Great! ✅ Payment Amount: ₹50,000 INR

All information collected! Let me prepare the final summary for you. [READY_FOR_DATA]"

**Example 5 - User confirms time-locked inference details:**
User: "Route it through Nova GPU for 90 days, agent 0xAgent, and yes park funds in the vault."
You: "Perfect! ✅ Escrow Type: Time-locked inference
✅ Provider Wallet: Nova GPU (0xAgent)
✅ Vault Opt-In: Yes, yield share noted

Could you also share the API endpoint or SLA target so I can configure monitoring?"

## Response Format:
1. If user provided new information: Acknowledge it specifically with ✅
2. **DO NOT show raw collection status or missing fields list**
3. Ask for the NEXT missing field in a natural, conversational way with examples
4. Be encouraging, professional, and friendly
5. Keep responses concise and focused on ONE question at a time
6. **NEVER mention wallet address as missing** - it's handled automatically

End your response with:
- [CONTINUE_INFO] - if more information is needed
- [READY_FOR_DATA] - if all 6 items are collected

Current stage: {stage}
Connected Wallet: {wallet_address}`;

        const prompt = ChatPromptTemplate.fromMessages([
            ["system", COLLECTION_SYSTEM_TEMPLATE],
            new MessagesPlaceholder({ variableName: "chat_history", optional: true }),
            ["human", "{input}"]
        ]);

        // Prepare collected info summary
        const collectedInfo = {
            projectInfo: state.projectInfo || {},
            clientInfo: state.clientInfo || {},
            financialInfo: state.financialInfo || {}
        };

        // Prepare collection status
        const collectionStatus = Object.entries(state.collectedFields || {}).map(([field, collected]) =>
            `- ${field}: ${collected ? '✅ Collected' : '❌ Missing'}`
        ).join('\n');

        const response = await prompt.pipe(model).invoke({
            input: state.input,
            chat_history: state.chatHistory,
            stage: state.stage || 'information_collection',
            collected_info: JSON.stringify(collectedInfo, null, 2),
            collection_status: collectionStatus,
            wallet_address: state.walletAddress || 'Not connected'
        });

        console.log(response.content, "Collection Node Response");

        // Use structured extraction to capture information
        let extractedData = {};
        const updatedState = { ...state };

        // Initialize state objects if they don't exist
        if (!updatedState.projectInfo) updatedState.projectInfo = {};
        if (!updatedState.clientInfo) updatedState.clientInfo = {};
        if (!updatedState.financialInfo) updatedState.financialInfo = {};
        if (!updatedState.contractOptions) updatedState.contractOptions = {};
        if (!updatedState.serviceMonitoring) updatedState.serviceMonitoring = {};

        try {
            const structuredLLM = model.withStructuredOutput(UserInputExtractionSchema, {
                name: "information_extraction",
                method: "function_calling"
            });

            const structuredResponse = await structuredLLM.invoke([
                new HumanMessage(state.input)
            ]);

            console.log("Structured extraction result:", JSON.stringify(structuredResponse, null, 2));

            if (structuredResponse && typeof structuredResponse === 'object' && structuredResponse.extractedInfo) {
                extractedData = structuredResponse;
                const extracted = structuredResponse.extractedInfo;

                // Update project info - preserve existing data
                if (extracted.projectName || extracted.projectDescription || extracted.timeline || extracted.deliverables) {
                    updatedState.projectInfo = {
                        ...updatedState.projectInfo,
                        ...(extracted.projectName && { projectName: extracted.projectName }),
                        ...(extracted.projectDescription && { projectDescription: extracted.projectDescription }),
                        ...(extracted.timeline && { timeline: extracted.timeline }),
                        ...(extracted.deliverables && { deliverables: extracted.deliverables })
                    };
                }

                // Update client info - preserve existing data
                // IMPORTANT: Do NOT use extracted.walletAddress - it comes from connected wallet only
                if (extracted.clientName || extracted.email) {
                    updatedState.clientInfo = {
                        ...updatedState.clientInfo,
                        ...(extracted.clientName && { clientName: extracted.clientName }),
                        ...(extracted.email && { email: extracted.email })
                        // walletAddress is handled separately from state.walletAddress (see line 488)
                    };
                }

                // Update financial info - preserve existing data
                if (extracted.paymentAmount) {
                    updatedState.financialInfo = {
                        ...updatedState.financialInfo,
                        paymentAmount: extracted.paymentAmount,
                        currency: 'INR'
                    };
                }

                if (extracted.escrowType || extracted.arbitrationPreference || extracted.arbitrationContract || typeof extracted.vaultOptIn !== 'undefined') {
                    const vaultPreference = typeof extracted.vaultOptIn === 'boolean'
                        ? extracted.vaultOptIn
                        : extracted.vaultOptIn || undefined;

                    updatedState.contractOptions = {
                        ...updatedState.contractOptions,
                        ...(extracted.escrowType && { escrowType: extracted.escrowType }),
                        ...(extracted.arbitrationPreference && { arbitrationPreference: extracted.arbitrationPreference }),
                        ...(extracted.arbitrationContract && { arbitrationContract: extracted.arbitrationContract }),
                        ...(typeof extracted.vaultOptIn !== 'undefined' && { vaultOptIn: vaultPreference })
                    };
                }

                if (extracted.serviceDuration || extracted.apiEndpoint || extracted.uptimeSLA) {
                    updatedState.serviceMonitoring = {
                        ...updatedState.serviceMonitoring,
                        ...(extracted.serviceDuration && { serviceDuration: extracted.serviceDuration }),
                        ...(extracted.apiEndpoint && { apiEndpoint: extracted.apiEndpoint }),
                        ...(extracted.uptimeSLA && { uptimeSLA: extracted.uptimeSLA })
                    };
                }
            }
        } catch (error) {
            console.log("Structured extraction failed, using fallback", error);
        }

        // If wallet address is provided in state but not in clientInfo, add it
        if (state.walletAddress && !updatedState.clientInfo.walletAddress) {
            updatedState.clientInfo.walletAddress = state.walletAddress;
        }

        // Update collected fields tracking
        const newCollectedFields = {
            projectName: !!(updatedState.projectInfo?.projectName),
            projectDescription: !!(updatedState.projectInfo?.projectDescription),
            clientName: !!(updatedState.clientInfo?.clientName),
            email: !!(updatedState.clientInfo?.email),
            walletAddress: !!(updatedState.clientInfo?.walletAddress || state.walletAddress),
            paymentAmount: !!(updatedState.financialInfo?.paymentAmount),
            escrowType: !!(updatedState.contractOptions?.escrowType),
            arbitrationPreference: !!(updatedState.contractOptions?.arbitrationPreference),
            arbitrationContract: !!(updatedState.contractOptions?.arbitrationContract),
            serviceDuration: !!(updatedState.serviceMonitoring?.serviceDuration),
            apiEndpoint: !!(updatedState.serviceMonitoring?.apiEndpoint),
            uptimeSLA: !!(updatedState.serviceMonitoring?.uptimeSLA),
            vaultOptIn: updatedState.contractOptions?.vaultOptIn !== undefined && updatedState.contractOptions?.vaultOptIn !== null,
        };

        const totalRequired = Object.keys(newCollectedFields).length;
        const collectedCount = Object.values(newCollectedFields).filter(Boolean).length;
        const progress = Math.round((collectedCount / totalRequired) * 80) + 10;

        console.log(`Collection progress: ${collectedCount}/6 fields collected (${progress}%)`);
        console.log("Collected fields:", newCollectedFields);

        // Determine next operation
        const content = response.content as string;
        let operation = "collect_initiator_info"; // Default: stay in collection mode
        let nextStage = 'information_collection';
        let isComplete = false;

        // Only move to final processing when ALL 6 fields are collected
        if (content.includes("[READY_FOR_DATA]") || collectedCount === totalRequired) {
            operation = "request_missing_info";
            nextStage = 'data_ready';
            isComplete = true;
            console.log("All information collected! Moving to final processing.");
        } else {
            console.log(`Still collecting information. Missing ${totalRequired - collectedCount} fields.`);
        }

        // Clean response
        const cleanedContent = content.replace(/\[(CONTINUE_INFO|READY_FOR_DATA)\]/g, '').trim();

        return {
            result: cleanedContent,
            messages: [cleanedContent],
            operation: operation,
            stage: nextStage,
            projectInfo: updatedState.projectInfo,
            clientInfo: updatedState.clientInfo,
            financialInfo: updatedState.financialInfo,
            contractOptions: updatedState.contractOptions,
            serviceMonitoring: updatedState.serviceMonitoring,
            progress: progress,
            stageIndex: isComplete ? 2 : 1,
            currentFlowStage: isComplete ? 'Information Complete' : 'Collecting Information',
            isStageComplete: isComplete,
            collectedFields: newCollectedFields,
            stageData: {
                extractedData,
                collectedCount,
                totalRequired
            },
            validationErrors: []
        };
    });

    // Final Data Processing Node: Validates and returns clean JSON
    graph.addNode("request_missing_info", async (state: ProjectState) => {
        const FINAL_SYSTEM_TEMPLATE = `You are Pakt AI's final data validator. Your role is to verify all collected information and provide a professional summary.

## CRITICAL VALIDATION RULES:
1. **VERIFY ALL FIELDS** - Ensure all 6 required fields are present
2. **NO ASSUMPTIONS** - Only use data that was actually collected
3. **CLEAR SUMMARY** - Present information in a user-friendly format

## Collected Information:

### Project Details:
- Project Name: {project_name}
- Description: {project_description}

### Client Information:
- Client Name: {client_name}
- Email: {email}
- Wallet Address: {wallet_address}

### Arbitration & Contract Options:
- Escrow Type: {escrow_type}
- Arbitration Preference: {arbitration_preference}
- Arbitration Contract: {arbitration_contract}
- Vault Opt-In: {vault_opt_in}

### Service Monitoring:
- API Endpoint: {api_endpoint}
- SLA Target: {uptime_sla}
- Service Duration: {service_duration}

### Financial Details:
- Payment Amount: ₹{payment_amount} INR
- Platform Fee (2.5%): ₹{platform_fee} INR
- Escrow Fee (0.5%): ₹{escrow_fee} INR
- Total Escrow Amount: ₹{total_amount} INR
- POL Token Equivalent: {pol_equivalent} POL

## Your Task:
Provide a professional summary that:

1. **Congratulates** the user on completing information collection
2. **Displays** all collected information in a clear format, including vault routing and any time-locked inference settings
3. **Shows** the financial breakdown with fees
4. **Explains** what happens next (contract generation and deployment)
5. **Asks for confirmation** before proceeding, calling out any remaining provider or monitoring items if missing

## Response Format:

🎉 **Information Collection Complete!**

Here's a summary of your project details:

**📋 Project Information:**
• Project Name: [name]
• Description: [description]

**👤 Client Information:**
• Name: [name]
• Email: [email]
• Wallet: [address]

**🤝 Arbitration & Contract Options:**
• Escrow Type: [escrow_type]
• Arbitration Preference: [arbitration_preference]
• Arbitration Contract: [arbitration_contract]
• Vault Opt-In: [vault_opt_in]

**📊 Service Monitoring:**
• API Endpoint: [api_endpoint]
• SLA Target: [uptime_sla]
• Service Duration: [service_duration]

**💰 Financial Breakdown:**
• Project Payment: ₹[amount] INR
• Platform Fee (2.5%): ₹[fee] INR
• Escrow Fee (0.5%): ₹[fee] INR
• **Total Escrow Amount: ₹[total] INR**
• POL Token Equivalent: [amount] POL

**🔄 Next Steps:**
1. Contract will be generated with these details
2. Both parties will sign the contract
3. Funds will be deposited into secure escrow
4. Work begins once escrow is confirmed

Please review the information above. If everything looks correct, we'll proceed with contract generation!

Always end with: [DATA_COMPLETE]`;

        const prompt = ChatPromptTemplate.fromMessages([
            ["system", FINAL_SYSTEM_TEMPLATE],
            new MessagesPlaceholder({ variableName: "chat_history", optional: true }),
            ["human", "Please compile the final project data."]
        ]);

        // Calculate comprehensive financial information
        const paymentAmount = state.financialInfo?.paymentAmount || 0;
        const platformFee = Math.round((paymentAmount * 0.025) * 100) / 100; // 2.5%
        const escrowFee = Math.round((paymentAmount * 0.005) * 100) / 100; // 0.5%
        const totalAmount = paymentAmount + platformFee + escrowFee;
        const polEquivalent = Math.round((totalAmount * 0.1) * 100) / 100; // Mock rate: 1 POL ≈ ₹10

        const response = await prompt.pipe(model).invoke({
            chat_history: state.chatHistory,
            stage: state.stage || 'data_ready',
            project_name: state.projectInfo?.projectName || "Untitled Project",
            project_description: state.projectInfo?.projectDescription || "No description",
            timeline: state.projectInfo?.timeline || "To be determined",
            client_name: state.clientInfo?.clientName || "Not provided",
            email: state.clientInfo?.email || "Not provided",
            wallet_address: state.clientInfo?.walletAddress || state.walletAddress || "Not provided",
            escrow_type: state.contractOptions?.escrowType || "Not selected",
            arbitration_preference: state.contractOptions?.arbitrationPreference || "Not specified",
            arbitration_contract: state.contractOptions?.arbitrationContract || "Not provided",
            vault_opt_in: state.contractOptions?.vaultOptIn === undefined || state.contractOptions?.vaultOptIn === null ? "Not set" : state.contractOptions?.vaultOptIn,
            api_endpoint: state.serviceMonitoring?.apiEndpoint || "Not provided",
            uptime_sla: state.serviceMonitoring?.uptimeSLA || "Not defined",
            service_duration: state.serviceMonitoring?.serviceDuration || "Not provided",
            payment_amount: paymentAmount.toFixed(2),
            platform_fee: platformFee.toFixed(2),
            escrow_fee: escrowFee.toFixed(2),
            total_amount: totalAmount.toFixed(2),
            pol_equivalent: polEquivalent.toFixed(2)
        });

        console.log(response.content, "Final Data Node Response");

        // Create comprehensive final data object - ONLY with collected information
        const finalProjectData = {
            projectInfo: {
                projectName: state.projectInfo?.projectName || "",
                projectDescription: state.projectInfo?.projectDescription || "",
                timeline: state.projectInfo?.timeline || "To be determined",
                deliverables: state.projectInfo?.deliverables || []
            },
            clientInfo: {
                clientName: state.clientInfo?.clientName || "",
                email: state.clientInfo?.email || "",
                walletAddress: state.clientInfo?.walletAddress || state.walletAddress || ""
            },
            financialInfo: {
                paymentAmount: paymentAmount,
                platformFees: platformFee,
                escrowFee: escrowFee,
                totalEscrowAmount: totalAmount,
                currency: "INR",
                polEquivalent: polEquivalent,
                feeBreakdown: {
                    projectPayment: paymentAmount,
                    platformFee: platformFee,
                    escrowFee: escrowFee,
                    total: totalAmount
                }
            },
            contractOptions: {
                escrowType: state.contractOptions?.escrowType || "",
                arbitrationPreference: state.contractOptions?.arbitrationPreference || "",
                arbitrationContract: state.contractOptions?.arbitrationContract || "",
                vaultOptIn: state.contractOptions?.vaultOptIn ?? ""
            },
            serviceMonitoring: {
                serviceDuration: state.serviceMonitoring?.serviceDuration || "",
                apiEndpoint: state.serviceMonitoring?.apiEndpoint || "",
                uptimeSLA: state.serviceMonitoring?.uptimeSLA || ""
            },
            escrowDetails: {
                escrowType: "freelance_project",
                paymentMethod: "POL_tokens",
                releaseCondition: "project_completion",
                disputeResolution: "automated_mediation"
            },
            metadata: {
                createdAt: new Date().toISOString(),
                stage: "data_complete",
                version: "1.0",
                platform: "Pakt",
                collectionComplete: true
            }
        };

        // Update final collected fields
        const finalCollectedFields = {
            projectName: !!finalProjectData.projectInfo.projectName,
            projectDescription: !!finalProjectData.projectInfo.projectDescription,
            clientName: !!finalProjectData.clientInfo.clientName,
            email: !!finalProjectData.clientInfo.email,
            walletAddress: !!finalProjectData.clientInfo.walletAddress,
            paymentAmount: !!finalProjectData.financialInfo.paymentAmount,
            escrowType: !!finalProjectData.contractOptions.escrowType,
            arbitrationPreference: !!finalProjectData.contractOptions.arbitrationPreference,
            arbitrationContract: !!finalProjectData.contractOptions.arbitrationContract,
            serviceDuration: !!finalProjectData.serviceMonitoring.serviceDuration,
            apiEndpoint: !!finalProjectData.serviceMonitoring.apiEndpoint,
            uptimeSLA: !!finalProjectData.serviceMonitoring.uptimeSLA,
            vaultOptIn: finalProjectData.contractOptions.vaultOptIn !== "" && finalProjectData.contractOptions.vaultOptIn !== null && finalProjectData.contractOptions.vaultOptIn !== undefined,
        };

        // Clean response and prepare JSON output
        const content = response.content as string;
        const cleanedContent = content.replace(/\[DATA_COMPLETE\]/g, '').trim();

        // Create the JSON output with markers (hidden from user)
        const jsonOutput = `[JSON_DATA_START]${JSON.stringify(finalProjectData, null, 2)}[JSON_DATA_END]`;

        // Show a clean success message to the user
        const userMessage = `✅ **Information Collection Successful!**

Thank you for providing all the details. Your contract is now being prepared.

**Contract Mode:** ${finalProjectData.contractOptions.escrowType || 'Standard escrow'}
**Arbitration:** ${finalProjectData.contractOptions.arbitrationPreference || 'Default automated mediation'}
**Vault Routing:** ${finalProjectData.contractOptions.vaultOptIn === "" || finalProjectData.contractOptions.vaultOptIn === null || finalProjectData.contractOptions.vaultOptIn === undefined ? 'Not specified' : finalProjectData.contractOptions.vaultOptIn}
**Service Monitoring:** ${finalProjectData.serviceMonitoring.apiEndpoint || 'No live service specified'}

**What's happening next:**
• Generating legal contract with Indian law compliance
• Processing with secure Polygon blockchain
• Preparing escrow smart contract
• Setting up arbitration and monitoring hooks

Please wait while we create your secure contract...`;

        // Combine user message with hidden JSON data
        const finalResponse = `${userMessage}\n\n${jsonOutput}`;

        console.log("=== FINAL DATA READY ===");
        console.log("JSON Output:", JSON.stringify(finalProjectData, null, 2));
        console.log("🚀 INFERENCE READY - Processing on Polygon");

        return {
            result: finalResponse,
            messages: [finalResponse],
            operation: "end",
            stage: 'completed',
            projectInfo: finalProjectData.projectInfo,
            clientInfo: finalProjectData.clientInfo,
            financialInfo: finalProjectData.financialInfo,
            contractOptions: finalProjectData.contractOptions,
            serviceMonitoring: finalProjectData.serviceMonitoring,
            finalData: finalProjectData,
            progress: 100,
            stageIndex: 3,
            currentFlowStage: 'Data Complete',
            isStageComplete: true,
            collectedFields: finalCollectedFields,
            stageData: {
                finalProjectData,
                completionTime: new Date().toISOString(),
                totalFields: Object.keys(finalCollectedFields).length,
                collectedFields: Object.values(finalCollectedFields).filter(Boolean).length,
                jsonReady: true
            },
            validationErrors: [],
            formData: finalProjectData,
            // POL Compute Integration - Signal that data is ready for inference
            inferenceReady: true,
            collectedData: finalProjectData
        };
    });

    // Stage-based routing function for efficient conversation flow
    const routeByStage = (state: ProjectState) => {
        console.log("=== START ROUTING ===");
        console.log("Stage:", state.stage);
        console.log("Operation:", state.operation);
        console.log("Information Collection:", state.information_collection);

        // ALWAYS start with initial_node for first message or when no stage is set
        if (!state.stage || state.stage === 'initial') {
            console.log("→ Routing to initial_node (first message or initial stage)");
            return "initial_node";
        }

        // If in information collection stage, go to collection node
        if (state.stage === 'information_collection') {
            console.log("→ Routing to collect_initiator_info (collection stage)");
            return "collect_initiator_info";
        }

        // If data is ready, go to final processing
        if (state.stage === 'data_ready') {
            console.log("→ Routing to request_missing_info (data ready)");
            return "request_missing_info";
        }

        // Default: go to initial node
        console.log("→ Routing to initial_node (default)");
        return "initial_node";
    };

    // Add conditional edges for stage-based routing
    graph.addConditionalEdges(START, routeByStage, {
        //@ts-ignore
        "initial_node": "initial_node",
        //@ts-ignore
        "collect_initiator_info": "collect_initiator_info",
        //@ts-ignore
        "request_missing_info": "request_missing_info"
    });

    // Add routing from initial_node based on user intent
    //@ts-ignore
    graph.addConditionalEdges("initial_node", (state: ProjectState) => {
        if (state.operation === "collect_initiator_info") {
            return "collect_initiator_info";
        }
        // Default to "end" string for all other cases
        return "end";
    }, {
        "collect_initiator_info": "collect_initiator_info",
        "end": END
    });

    // Add routing from collect_initiator_info based on completion status
    //@ts-ignore
    graph.addConditionalEdges("collect_initiator_info", (state: ProjectState) => {
        console.log("Routing from collect_initiator_info. Operation:", state.operation, "Stage:", state.stage);

        // If all information is collected, move to final processing
        if (state.operation === "request_missing_info" && state.stage === 'data_ready') {
            console.log("→ Moving to request_missing_info (final processing)");
            return "request_missing_info";
        }

        // Otherwise, END and wait for next user message
        console.log("→ Ending conversation (waiting for user input)");
        return "end";
    }, {
        "request_missing_info": "request_missing_info",
        "end": END
    });

    // Add edge from request_missing_info to END
    //@ts-ignore
    graph.addEdge("request_missing_info", END);

    const data = graph.compile();
    return data;
}