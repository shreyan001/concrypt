# Objective: Atomic Bug Bounty Handover System


---

## The Concept: Atomic Bug Bounty Delivery

A trustless system where a bug reporter sells a verified fix to a 
client, with an AI evaluator acting as the neutral middleman.

### Parties
- **Proposer** — Found a bug, wants to sell the fix
- **Client** — Owns the affected product, wants to buy the fix
- **Evaluator Agent** — Autonomous LangGraph agent that verifies 
  delivery and brokers the handover

---

## The Flow

### Stage 1 — Deal Setup
- Proposer creates a contract: describes the bug, sets asking 
  price (e.g. $10,000)
- Proposer optionally puts up a slashing fee (e.g. $500) as a 
  seriousness signal — NOT mandatory
- Client reviews and deposits $10,000 into escrow to accept the deal

### Stage 2 — Delivery & Evaluation (LangGraph Pipeline)
- Proposer submits the required payload on-chain (triggers `JobSubmitted` event).
- Evaluator Agent independently executes:
  - **Node 1/2 (Ingest & Inspect):** Parses payload, clones the private GitHub repo, and runs static analysis.
  - **Node 3 (Verification Engine):** Runs automated tests and verifies the live deployment.
  - **Node 4 (Client Preview):** Extracts the GitHub deployment directly as proof and presents a website verification step to the Client to preview. The agent pauses here.

### Stage 3 — Resolution (On-Chain Settlement)
1. **Success (Client Approves)**
   - **Node 5 (Finalization):** Evaluator downloads a copy of the exact codebase from the verified instance, zips it, uploads it to a Filecoin bucket, and encrypts the CID via Lit Protocol for the Client.
   - **Node 6 (Settlement):** Agent calls `complete()` on-chain. Proposer receives the bounty and gets their collateral back.
2. **Failure (Client Rejects / Verification Fails)** 
   - **Node 6 (Settlement):** Agent calls `reject()` on-chain. Client is refunded the $10k bounty, and the Proposer's collateral ($500) is slashed & sent to the Client (enforced by `CollateralHook`).
---

## Smart Contract Requirements

- Generic and reusable — no hardcoded amounts or conditions
- Slashing fee is fully optional
- Hooks for: deposit, approve, cancel, claimSlash, release
- Supports amicable cancellation before deliverable is submitted
- Reference EIP-8183 evaluator pattern for hook design:
  https://eips.ethereum.org/EIPS/eip-8183

---

## What To Build

### Step 1 — Plan
- Read EIP-8183 fully (evaluator + hooks sections)
- Create `PROJECT_PLAN.md` in repo root with:
  - Architecture overview
  - Smart contract design
  - Evaluator agent design (LangGraph)
  - External dependencies needed:
    - Lit Protocol (encryption/decryption keys)
    - Filecoin/IPFS (off-chain storage)
    - GitHub API keys (evaluator access)
    - Wallet setup for testing
  - File/folder structure for monorepo

### Step 2 — Smart Contract
- Write the Solidity contract in `contracts/AtomicHandover.sol`
- Cover all hooks and the 3 resolution outcomes
- Make slashing fee optional via constructor param

### Step 3 — Backend Agent Scaffold
- Scaffold the LangGraph evaluator agent in `backend/`
- Save agent context, required env vars, and config 
  to `backend/AGENT_CONTEXT.md`

### Step 4 — Test
- Write a full test in `contracts/test/AtomicHandover.test.js`
- Cover all 3 stages and all 3 resolution paths
- Deploy to testnet, run tests, save report to `TEST_REPORT.md`

---

## Start with Step 1. Do not skip saving the plan.
