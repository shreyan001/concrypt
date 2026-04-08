// SPDX-License-Identifier: MIT
/**
 * PaktV1 Contract ABI and Type Definitions
 * 
 * This file contains the complete ABI for the PaktV1 smart contract
 * deployed on the Polygon blockchain, along with TypeScript type definitions.
 */

export const Pakt_ABI = [
  {
    type: 'constructor',
    inputs: [
      { name: '_verificationAgent', type: 'address', internalType: 'address' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'createAndDeposit',
    inputs: [
      { name: 'orderHash', type: 'bytes32', internalType: 'bytes32' },
      { name: 'freelancer', type: 'address', internalType: 'address payable' },
      { name: 'escrowAmount', type: 'uint256', internalType: 'uint256' },
      { name: 'projectName', type: 'string', internalType: 'string' },
    ],
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'verifyDeliverable',
    inputs: [
      { name: 'orderHash', type: 'bytes32', internalType: 'bytes32' },
      { name: 'verificationDetails', type: 'string', internalType: 'string' },
      { name: 'isValid', type: 'bool', internalType: 'bool' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'approvePayment',
    inputs: [{ name: 'orderHash', type: 'bytes32', internalType: 'bytes32' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'withdrawFunds',
    inputs: [{ name: 'orderHash', type: 'bytes32', internalType: 'bytes32' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getOrder',
    inputs: [{ name: 'orderHash', type: 'bytes32', internalType: 'bytes32' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        internalType: 'struct PaktV1.Order',
        components: [
          { name: 'orderHash', type: 'bytes32', internalType: 'bytes32' },
          { name: 'initiator', type: 'address', internalType: 'address' },
          { name: 'freelancer', type: 'address', internalType: 'address payable' },
          { name: 'escrowAmount', type: 'uint256', internalType: 'uint256' },
          { name: 'projectName', type: 'string', internalType: 'string' },
          { name: 'currentState', type: 'uint8', internalType: 'enum PaktV1.OrderState' },
          { name: 'createdTimestamp', type: 'uint256', internalType: 'uint256' },
          { name: 'verifiedTimestamp', type: 'uint256', internalType: 'uint256' },
          { name: 'completedTimestamp', type: 'uint256', internalType: 'uint256' },
          { name: 'verificationDetails', type: 'string', internalType: 'string' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getVerificationDetails',
    inputs: [{ name: 'orderHash', type: 'bytes32', internalType: 'bytes32' }],
    outputs: [{ name: '', type: 'string', internalType: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getContractBalance',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'owner',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'verificationAgent',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'updateVerificationAgent',
    inputs: [{ name: 'newAgent', type: 'address', internalType: 'address' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    name: 'OrderCreatedAndFunded',
    inputs: [
      { name: 'orderHash', type: 'bytes32', indexed: true, internalType: 'bytes32' },
      { name: 'initiator', type: 'address', indexed: true, internalType: 'address' },
      { name: 'freelancer', type: 'address', indexed: true, internalType: 'address' },
      { name: 'totalAmount', type: 'uint256', indexed: false, internalType: 'uint256' },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'DeliverableVerified',
    inputs: [
      { name: 'orderHash', type: 'bytes32', indexed: true, internalType: 'bytes32' },
      { name: 'verificationAgent', type: 'address', indexed: false, internalType: 'address' },
      { name: 'timestamp', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'verificationDetails', type: 'string', indexed: false, internalType: 'string' },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'VerificationFailed',
    inputs: [
      { name: 'orderHash', type: 'bytes32', indexed: true, internalType: 'bytes32' },
      { name: 'verificationAgent', type: 'address', indexed: false, internalType: 'address' },
      { name: 'timestamp', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'reason', type: 'string', indexed: false, internalType: 'string' },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'PaymentApproved',
    inputs: [
      { name: 'orderHash', type: 'bytes32', indexed: true, internalType: 'bytes32' },
      { name: 'approver', type: 'address', indexed: false, internalType: 'address' },
      { name: 'timestamp', type: 'uint256', indexed: false, internalType: 'uint256' },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'WithdrawalCompleted',
    inputs: [
      { name: 'orderHash', type: 'bytes32', indexed: true, internalType: 'bytes32' },
      { name: 'freelancer', type: 'address', indexed: false, internalType: 'address' },
      { name: 'amount', type: 'uint256', indexed: false, internalType: 'uint256' },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'OrderStateChanged',
    inputs: [
      { name: 'orderHash', type: 'bytes32', indexed: true, internalType: 'bytes32' },
      { name: 'newState', type: 'uint8', indexed: false, internalType: 'enum PaktV1.OrderState' },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'VerificationAgentUpdated',
    inputs: [
      { name: 'oldAgent', type: 'address', indexed: true, internalType: 'address' },
      { name: 'newAgent', type: 'address', indexed: true, internalType: 'address' },
    ],
    anonymous: false,
  },
] as const;

/**
 * Order state enum matching the Solidity contract
 */
export enum OrderState {
  PENDING = 0,
  ACTIVE = 1,
  VERIFIED = 2,
  APPROVED = 3,
  COMPLETED = 4,
  DISPUTED = 5,
  VERIFICATION_FAILED = 6,
}

/**
 * Human-readable order state labels
 */
export const ORDER_STATE_LABELS: Record<OrderState, string> = {
  [OrderState.PENDING]: 'Pending',
  [OrderState.ACTIVE]: 'Active',
  [OrderState.VERIFIED]: 'Verified',
  [OrderState.APPROVED]: 'Approved',
  [OrderState.COMPLETED]: 'Completed',
  [OrderState.DISPUTED]: 'Disputed',
  [OrderState.VERIFICATION_FAILED]: 'Verification Failed',
};

/**
 * Order state descriptions
 */
export const ORDER_STATE_DESCRIPTIONS: Record<OrderState, string> = {
  [OrderState.PENDING]: 'Order is being created',
  [OrderState.ACTIVE]: 'Escrow funded, awaiting deliverable submission',
  [OrderState.VERIFIED]: 'Deliverable verified by agent, awaiting client approval',
  [OrderState.APPROVED]: 'Payment approved, freelancer can withdraw funds',
  [OrderState.COMPLETED]: 'Funds withdrawn, order complete',
  [OrderState.DISPUTED]: 'Order is in dispute resolution',
  [OrderState.VERIFICATION_FAILED]: 'Deliverable verification failed',
};

/**
 * Valid state transitions
 */
export const STATE_TRANSITIONS: Record<OrderState, OrderState[]> = {
  [OrderState.PENDING]: [OrderState.ACTIVE],
  [OrderState.ACTIVE]: [OrderState.VERIFIED, OrderState.VERIFICATION_FAILED],
  [OrderState.VERIFIED]: [OrderState.APPROVED],
  [OrderState.APPROVED]: [OrderState.COMPLETED],
  [OrderState.COMPLETED]: [],
  [OrderState.DISPUTED]: [OrderState.VERIFIED, OrderState.VERIFICATION_FAILED],
  [OrderState.VERIFICATION_FAILED]: [OrderState.ACTIVE], // Allow resubmission
};

/**
 * Check if a state transition is valid
 */
export function canTransitionTo(currentState: OrderState, targetState: OrderState): boolean {
  return STATE_TRANSITIONS[currentState].includes(targetState);
}
