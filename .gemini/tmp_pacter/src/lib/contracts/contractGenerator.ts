/**
 * Contract Generator Utility
 * 
 * Generates legal contract text from collected project data
 * for Indian freelance agreements
 */

import { CollectedContractData } from '@/lib/types';

/**
 * Generate a legal contract text for Indian freelance projects
 * @param data Collected contract data from information collection
 * @returns Formatted legal contract text
 */
export function generateIndianFreelanceContract(data: CollectedContractData): string {
  const currentDate = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return `
FREELANCE SERVICE AGREEMENT

This Freelance Service Agreement ("Agreement") is entered into on ${currentDate} ("Effective Date")

BETWEEN:

CLIENT:
Name: ${data.clientInfo.clientName}
Email: ${data.clientInfo.email}
Wallet Address: ${data.clientInfo.walletAddress}
(Hereinafter referred to as "Client")

AND

FREELANCER:
[To be determined upon acceptance]
(Hereinafter referred to as "Freelancer")

WHEREAS the Client desires to engage the Freelancer to provide certain services, and the Freelancer agrees to provide such services under the terms and conditions set forth in this Agreement.

NOW, THEREFORE, in consideration of the mutual covenants and agreements herein contained, the parties agree as follows:

1. PROJECT DETAILS

1.1 Project Name: ${data.projectInfo.projectName}

1.2 Project Description:
${data.projectInfo.projectDescription}

1.3 Timeline: ${data.projectInfo.timeline}

1.4 Deliverables:
${data.projectInfo.deliverables.map((d, i) => `   ${i + 1}. ${d}`).join('\n')}

2. PAYMENT TERMS

2.1 Total Project Payment: ₹${data.financialInfo.paymentAmount.toLocaleString('en-IN')} (Indian Rupees ${data.financialInfo.paymentAmount} only)

2.2 Payment Breakdown:
   - Project Payment: ₹${data.financialInfo.feeBreakdown.projectPayment.toLocaleString('en-IN')}
   - Platform Fee (2.5%): ₹${data.financialInfo.feeBreakdown.platformFee.toLocaleString('en-IN')}
   - Escrow Service Fee (0.5%): ₹${data.financialInfo.feeBreakdown.escrowFee.toLocaleString('en-IN')}
   - Total Escrow Amount: ₹${data.financialInfo.feeBreakdown.total.toLocaleString('en-IN')}

2.3 Payment Method: The payment shall be held in escrow using POL blockchain technology and released upon successful completion and verification of deliverables.

2.4 POL Token Equivalent: ${data.financialInfo.polEquivalent} POL tokens (for blockchain execution)

3. ESCROW TERMS

3.1 Escrow Type: ${data.escrowDetails.escrowType.replace(/_/g, ' ').toUpperCase()}

3.2 Payment Method: ${data.escrowDetails.paymentMethod.replace(/_/g, ' ')}

3.3 Release Condition: Payment shall be released upon ${data.escrowDetails.releaseCondition.replace(/_/g, ' ')}

3.4 The Client shall deposit the Total Escrow Amount into the Pakt escrow system before work commences.

3.5 Funds shall be held securely in the escrow smart contract until all deliverables are completed and verified.

4. SCOPE OF WORK

4.1 The Freelancer agrees to provide the services as described in Section 1 (Project Details).

4.2 The Freelancer shall deliver all work products in a professional and timely manner.

4.3 All deliverables must meet the specifications outlined in the Project Description.

5. INTELLECTUAL PROPERTY RIGHTS

5.1 Upon full payment, all intellectual property rights in the work product shall transfer to the Client.

5.2 The Freelancer warrants that all work product is original and does not infringe upon any third-party rights.

6. PAYMENT METHODS AND CRYPTOCURRENCY CLAUSE

6.1 The Parties agree that payment for services rendered may be made in Indian Rupees (INR), cryptocurrency (including but not limited to Bitcoin, Ethereum, USDT, or other Virtual Digital Assets as per Indian law), or by lawful barter (as defined in Section 23, Indian Contract Act, 1872).

6.2 For cryptocurrency or barter, the exact value must be determined and recorded in INR on the date of transaction/settlement for tax and legal purposes.

6.3 All parties are responsible for compliance with Indian tax laws, including declaration of professional income under Section 28 of the Income Tax Act, 1961.

6.4 Receipt of cryptocurrency or barter is NOT recognized as legal tender under Indian law but is considered contractually binding between parties under the Indian Contract Act, 1872.

6.5 All payment transactions, INR conversions, and barter details must be documented and preserved.

7. ESCROW AND DEPOSIT CLAUSE

7.1 Prior to commencement of work, the Client shall deposit the agreed compensation (in INR, cryptocurrency, or barter-equivalent value) into an escrow smart contract on blockchain, or a mutually nominated escrow account.

7.2 Escrowed amounts or assets are to be locked and inaccessible until both parties approve release, OR in case of a dispute, until resolution is completed per this agreement.

7.3 If there is a conflict, the escrow remains frozen until the AI agent, mediator, arbitrator, or court has resolved the issue.

7.4 Records of all escrow transactions are to be maintained, and contracts must specify the escrow wallet/account.

8. SMART CONTRACT CLAUSE

8.1 The Agreement may be executed or supplemented using a blockchain-based smart contract.

8.2 Such a smart contract automates payments, milestone tracking, and digital audit logging.

8.3 All actions and signatures executed on-chain are valid and enforceable under the Indian Contract Act, 1872 and Information Technology Act, 2000.

8.4 Digital records from the contract may be relied upon as evidence.

9. CONFIDENTIALITY

9.1 Both parties agree to maintain confidentiality of all proprietary information shared during the course of this engagement.

9.2 This obligation shall survive the termination of this Agreement.

10. AI DISPUTE RESOLUTION AND FALLBACK

10.1 In case of any controversy, claim, or dispute arising from this Agreement, the parties shall first submit the issue to an AI agent for automated assessment and suggested resolution.

10.2 The AI agent will review all on-chain and off-chain evidence, project records, milestones, payment status, and recommend a settlement.

10.3 If the dispute remains unresolved or either Party disagrees with the outcome after 7 days, the matter shall proceed to mediation/arbitration as per the Arbitration & Conciliation Act, 1996.

10.4 If still unresolved, the matter shall proceed to the courts of India.

10.5 All final compensation, awards, or damages are to be paid in INR, with conversion from crypto or barter as per prevailing rates on date of settlement.

10.6 Dispute Resolution Method: ${data.escrowDetails.disputeResolution.replace(/_/g, ' ')}

11. JURISDICTION AND GOVERNING LAW

11.1 This Agreement is governed by the laws of India, including but not limited to:
   - Indian Contract Act, 1872
   - Information Technology Act, 2000
   - Arbitration & Conciliation Act, 1996
   - Income Tax Act, 1961
   - Goods and Services Tax Act, 2017

11.2 Only lawful goods/services may be accepted for barter as per Section 23, Indian Contract Act, 1872.

11.3 Cryptocurrency is defined according to current Indian law as a Virtual Digital Asset (VDA), not legal tender, but permitted for settlement by mutual agreement in commercial contracts.

11.4 Any legal proceedings shall be subject to the exclusive jurisdiction of courts in India.

12. TERMINATION

12.1 Either party may terminate this Agreement with written notice if the other party breaches any material term.

12.2 Upon termination, the Client shall pay for all work completed up to the termination date.

12.3 Escrow funds shall be released according to the verified work completed.

13. WARRANTIES AND REPRESENTATIONS

13.1 The Freelancer warrants that they have the necessary skills and expertise to complete the project.

13.2 The Client warrants that they have the authority to enter into this Agreement.

13.3 Both parties warrant that they will comply with all applicable laws and regulations.

14. LIMITATION OF LIABILITY

14.1 Neither party shall be liable for indirect, incidental, or consequential damages.

14.2 Total liability under this Agreement shall not exceed the Total Project Payment amount.

15. FORCE MAJEURE

15.1 Neither party shall be liable for delays or failures in performance resulting from acts beyond their reasonable control.

16. ENTIRE AGREEMENT

16.1 This Agreement constitutes the entire agreement between the parties and supersedes all prior negotiations and agreements.

16.2 Any modifications must be made in writing and signed by both parties.

17. SEVERABILITY

17.1 If any provision of this Agreement is found to be unenforceable, the remaining provisions shall continue in full force and effect.

18. NOTICES

18.1 All notices under this Agreement shall be sent to the email addresses provided above.

19. BLOCKCHAIN EXECUTION

19.1 This Agreement is executed through the Pakt platform using POL blockchain technology.

19.2 Smart contract address and transaction details shall be recorded upon escrow deposit.

19.3 All blockchain transactions are immutable and verifiable.

ACCEPTANCE

By signing below or by digital signature through the Pakt platform, both parties acknowledge that they have read, understood, and agree to be bound by the terms and conditions of this Agreement.

CLIENT SIGNATURE:
Name: ${data.clientInfo.clientName}
Date: ${currentDate}
Wallet Address: ${data.clientInfo.walletAddress}

FREELANCER SIGNATURE:
Name: _______________________
Date: _______________________
Wallet Address: _______________________

---

PLATFORM INFORMATION:
Platform: ${data.metadata.platform}
Version: ${data.metadata.version}
Contract Created: ${new Date(data.metadata.createdAt).toLocaleString('en-IN')}
Stage: ${data.metadata.stage}

This is a legally binding agreement. Please review carefully before signing.
Generated by Pakt - Secure Escrow Platform
`.trim();
}

/**
 * Generate a simple basic contract (without crypto/escrow clauses)
 * @param data Collected contract data
 * @returns Simple contract text
 */
export function generateSimpleContract(data: CollectedContractData): string {
  const currentDate = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return `
FREELANCE SERVICE AGREEMENT

This Freelance Service Agreement ("Agreement") is entered into on ${currentDate}

BETWEEN:

CLIENT:
Name: ${data.clientInfo.clientName}
Email: ${data.clientInfo.email}
(Hereinafter referred to as "Client")

AND

FREELANCER:
[To be determined upon acceptance]
(Hereinafter referred to as "Freelancer")

1. PROJECT DETAILS

1.1 Project Name: ${data.projectInfo.projectName}

1.2 Project Description:
${data.projectInfo.projectDescription}

1.3 Timeline: ${data.projectInfo.timeline}

1.4 Deliverables:
${data.projectInfo.deliverables.map((d, i) => `   ${i + 1}. ${d}`).join('\n')}

2. PAYMENT TERMS

2.1 Total Project Payment: ₹${data.financialInfo.paymentAmount.toLocaleString('en-IN')} (Indian Rupees ${data.financialInfo.paymentAmount} only)

2.2 Payment shall be made upon successful completion and verification of deliverables.

3. SCOPE OF WORK

3.1 The Freelancer agrees to provide the services as described in Section 1 (Project Details).

3.2 The Freelancer shall deliver all work products in a professional and timely manner.

3.3 All deliverables must meet the specifications outlined in the Project Description.

4. INTELLECTUAL PROPERTY RIGHTS

4.1 Upon full payment, all intellectual property rights in the work product shall transfer to the Client.

4.2 The Freelancer warrants that all work product is original and does not infringe upon any third-party rights.

5. CONFIDENTIALITY

5.1 Both parties agree to maintain confidentiality of all proprietary information shared during the course of this engagement.

5.2 This obligation shall survive the termination of this Agreement.

6. TERMINATION

6.1 Either party may terminate this Agreement with written notice if the other party breaches any material term.

6.2 Upon termination, the Client shall pay for all work completed up to the termination date.

7. GOVERNING LAW

7.1 This Agreement is governed by the laws of India, including but not limited to:
   - Indian Contract Act, 1872
   - Information Technology Act, 2000

8. ENTIRE AGREEMENT

8.1 This Agreement constitutes the entire agreement between the parties and supersedes all prior negotiations and agreements.

8.2 Any modifications must be made in writing and signed by both parties.

ACCEPTANCE

By signing below, both parties acknowledge that they have read, understood, and agree to be bound by the terms and conditions of this Agreement.

CLIENT SIGNATURE:
Name: ${data.clientInfo.clientName}
Date: ${currentDate}

FREELANCER SIGNATURE:
Name: _______________________
Date: _______________________

---

Generated by Pakt on ${currentDate}
`.trim();
}
