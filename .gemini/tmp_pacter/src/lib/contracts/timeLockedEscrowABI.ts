// SPDX-License-Identifier: MIT
/**
 * TimeboxInferenceEscrowV2 ABI and related types.
 *
 * The ABI is derived from `PaktEscrow/TimeLockedEscrow.sol` to power
 * type-safe Viem interactions.
 */

import type { Abi } from "viem";

export const TIMELOCKED_ESCROW_ABI: Abi = [
  {
    type: "constructor",
    stateMutability: "payable",
    inputs: [
      { name: "_client", type: "address" },
      { name: "_provider", type: "address" },
      { name: "_agent", type: "address" },
      { name: "_arbitrationContract", type: "address" },
      { name: "_vault", type: "address" },
      { name: "_durationSeconds", type: "uint256" },
    ],
  },
  {
    type: "receive",
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "agent",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "arbitrationContract",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "claim",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "client",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "durationSeconds",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "accumulatedPausedSeconds",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "escrowBalance",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "fund",
    inputs: [],
    outputs: [],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "fundedAmount",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "openArbitration",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "pauseService",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "paused",
    inputs: [],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "pausedAt",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "provider",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "renew",
    inputs: [{ name: "extraSeconds", type: "uint256" }],
    outputs: [],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "resumeService",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "setArbitrationContract",
    inputs: [{ name: "_arb", type: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "startService",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "startTimestamp",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "vault",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "vaultBalance",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "lastClaimedTimestamp",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "Claimed",
    inputs: [
      { name: "amount", type: "uint256", indexed: false },
      { name: "at", type: "uint256", indexed: false },
    ],
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
    name: "Paused",
    inputs: [
      { name: "by", type: "address", indexed: true },
      { name: "at", type: "uint256", indexed: false },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "Renewed",
    inputs: [
      { name: "addAmount", type: "uint256", indexed: false },
      { name: "newDuration", type: "uint256", indexed: false },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "Resumed",
    inputs: [
      { name: "by", type: "address", indexed: true },
      { name: "at", type: "uint256", indexed: false },
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
  {
    type: "event",
    name: "Started",
    inputs: [
      { name: "start", type: "uint256", indexed: false },
      { name: "duration", type: "uint256", indexed: false },
    ],
    anonymous: false,
  },
];
