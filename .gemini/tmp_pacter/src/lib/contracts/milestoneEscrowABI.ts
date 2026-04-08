// SPDX-License-Identifier: MIT
/**
 * MilestoneEscrow ABI and related types.
 *
 * The ABI is manually curated from `PaktEscrow/MilestoneEscrow.sol` and
 * enables typed frontend interactions via Viem clients.
 */

import type { Abi } from "viem";

export const MILESTONE_ESCROW_ABI: Abi = [
  {
    type: "constructor",
    stateMutability: "payable",
    inputs: [
      { name: "_client", type: "address" },
      { name: "_freelancer", type: "address" },
      { name: "_agent", type: "address" },
      { name: "_arbitration", type: "address" },
      { name: "_vault", type: "address" },
      { name: "_storageFee", type: "uint256" },
    ],
  },
  {
    type: "receive",
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "addMilestone",
    stateMutability: "nonpayable",
    inputs: [
      { name: "amount", type: "uint256" },
      { name: "desc", type: "string" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "agent",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "approveMilestone",
    stateMutability: "nonpayable",
    inputs: [{ name: "id", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "arbitrationContract",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "claimMilestone",
    stateMutability: "nonpayable",
    inputs: [{ name: "id", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "client",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "contractBalance",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "fund",
    stateMutability: "payable",
    inputs: [],
    outputs: [],
  },
  {
    type: "function",
    name: "freelancer",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "milestoneCount",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "milestones",
    stateMutability: "view",
    inputs: [{ name: "", type: "uint256" }],
    outputs: [
      { name: "amount", type: "uint256" },
      { name: "description", type: "string" },
      { name: "verifiedByAgent", type: "bool" },
      { name: "clientApproved", type: "bool" },
      { name: "paid", type: "bool" },
      { name: "verificationHash", type: "string" },
    ],
  },
  {
    type: "function",
    name: "openDispute",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
  {
    type: "function",
    name: "sendToArbitration",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
  {
    type: "function",
    name: "state",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
  {
    type: "function",
    name: "storageFee",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "vault",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "vaultBalanceOfEscrow",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "verifyMilestone",
    stateMutability: "nonpayable",
    inputs: [
      { name: "id", type: "uint256" },
      { name: "proof", type: "string" },
      { name: "passed", type: "bool" },
    ],
    outputs: [],
  },
  {
    type: "event",
    name: "ContractStateChanged",
    inputs: [{ name: "newState", type: "uint8", indexed: false }],
    anonymous: false,
  },
  {
    type: "event",
    name: "Funded",
    inputs: [
      { name: "by", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "MilestoneAdded",
    inputs: [
      { name: "id", type: "uint256", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
      { name: "desc", type: "string", indexed: false },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "MilestoneApproved",
    inputs: [
      { name: "id", type: "uint256", indexed: true },
      { name: "client", type: "address", indexed: true },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "MilestonePaid",
    inputs: [
      { name: "id", type: "uint256", indexed: true },
      { name: "freelancer", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "MilestoneVerified",
    inputs: [
      { name: "id", type: "uint256", indexed: true },
      { name: "agent", type: "address", indexed: true },
      { name: "hash", type: "string", indexed: false },
      { name: "passed", type: "bool", indexed: false },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "SentToArbitration",
    inputs: [
      { name: "arbitration", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
    anonymous: false,
  },
];

export enum MilestoneEscrowState {
  CREATED = 0,
  FUNDED = 1,
  DISPUTED = 2,
  CLOSED = 3,
}
