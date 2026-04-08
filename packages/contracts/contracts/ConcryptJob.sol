// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@fhenixprotocol/contracts/FHE.sol";
import "./interfaces/IACP.sol";
import "./interfaces/IACPHook.sol";

/**
 * @title ConcryptJob
 * @dev Confidential implementation of EIP-8183 using Fhenix FHE.
 */
contract ConcryptJob is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum JobStatus { Open, Funded, Submitted, Completed, Rejected, Expired }

    struct Job {
        address client;
        address provider;
        address evaluator;
        euint256 eBudget;
        ebytes32 eDeliverable;
        ebytes   eDescription;
        uint256  expiredAt;
        JobStatus status;
        address hook;
    }

    IERC20 public immutable paymentToken;
    uint256 public nextJobId;
    mapping(uint256 => Job) private _jobs;

    event JobCreated(uint256 indexed jobId, address indexed client, address indexed provider, address evaluator, uint256 expiredAt, address hook);
    event ProviderSet(uint256 indexed jobId, address indexed provider);
    event JobFunded(uint256 indexed jobId, address indexed client);
    event JobSubmitted(uint256 indexed jobId, address indexed provider);
    event JobCompleted(uint256 indexed jobId, address indexed evaluator, bytes32 reason);
    event JobRejected(uint256 indexed jobId, address indexed rejector, bytes32 reason);
    event PaymentReleased(uint256 indexed jobId, address indexed provider, uint256 amount);

    constructor(address _paymentToken) Ownable(msg.sender) {
        paymentToken = IERC20(_paymentToken);
    }

    function createJob(
        address provider,
        address evaluator,
        uint256 expiredAt,
        inEbytes calldata encryptedDescription,
        address hook
    ) external returns (uint256 jobId) {
        require(evaluator != address(0), "Evaluator cannot be zero");
        require(expiredAt > block.timestamp, "Expiry must be in future");

        jobId = nextJobId++;
        Job storage job = _jobs[jobId];
        
        job.client = msg.sender;
        job.provider = provider;
        job.evaluator = evaluator;
        job.expiredAt = expiredAt;
        job.eDescription = FHE.asEbytes(encryptedDescription);
        job.status = JobStatus.Open;
        job.hook = hook;

        FHE.allowSender(job.eDescription);
        FHE.allowThis(job.eDescription);

        emit JobCreated(jobId, msg.sender, provider, evaluator, expiredAt, hook);
    }

    function fund(uint256 jobId, inEuint256 calldata encryptedBudget, uint256 plaintextBudgetForTransfer) external nonReentrant {
        Job storage job = _jobs[jobId];
        require(job.status == JobStatus.Open, "Invalid job status");
        require(msg.sender == job.client, "Only client can fund");
        require(job.provider != address(0), "Provider not set");

        job.eBudget = FHE.asEuint256(encryptedBudget);
        
        // In a real CoFHE scenario, we might verify that plaintextBudgetForTransfer == decrypted eBudget
        // For this demo, we trust the client to provide enough tokens to cover the encrypted budget.
        paymentToken.safeTransferFrom(msg.sender, address(this), plaintextBudgetForTransfer);
        
        job.status = JobStatus.Funded;

        FHE.allow(job.eBudget, job.evaluator);
        FHE.allowThis(job.eBudget);

        emit JobFunded(jobId, msg.sender);
    }

    function submit(uint256 jobId, inEbytes32 calldata encryptedDeliverable) external {
        Job storage job = _jobs[jobId];
        require(job.status == JobStatus.Funded, "Invalid job status");
        require(msg.sender == job.provider, "Only provider can submit");

        job.eDeliverable = FHE.asEbytes32(encryptedDeliverable);
        job.status = JobStatus.Submitted;

        FHE.allow(job.eDeliverable, job.evaluator);
        FHE.allowThis(job.eDeliverable);

        emit JobSubmitted(jobId, msg.sender);
    }

    function complete(uint256 jobId, bytes32 reason) external nonReentrant {
        Job storage job = _jobs[jobId];
        require(job.status == JobStatus.Submitted, "Invalid job status");
        require(msg.sender == job.evaluator, "Only evaluator can complete");

        // Decrypt the budget for payment release
        // In Fhenix, the evaluator (who has permission) can call this.
        uint256 amount = FHE.decrypt(job.eBudget);

        job.status = JobStatus.Completed;
        paymentToken.safeTransfer(job.provider, amount);
        
        emit JobCompleted(jobId, msg.sender, reason);
        emit PaymentReleased(jobId, job.provider, amount);
    }

    function getJob(uint256 jobId) external view returns (
        address client,
        address provider,
        address evaluator,
        uint256 expiredAt,
        JobStatus status,
        address hook
    ) {
        Job storage j = _jobs[jobId];
        return (j.client, j.provider, j.evaluator, j.expiredAt, j.status, j.hook);
    }
}
