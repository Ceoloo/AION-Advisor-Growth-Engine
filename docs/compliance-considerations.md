# Compliance Considerations

> **This document does not constitute legal advice, and the presence of technical
> controls does not make the system legally compliant.** A qualified legal and
> compliance professional must review the platform, its configuration, and its
> operational processes before any production deployment or use with real
> consumer data.

AION handles sensitive financial and health-related information across regulated
industries. The skeleton is *designed for future alignment* with the regimes
below; alignment is a program, not a code feature.

## Regimes to evaluate (non-exhaustive)

| Regime | Relevance | Notes |
| --- | --- | --- |
| **HIPAA** | Health insurance PHI | Health qualification captures PHI-adjacent data (prescriptions, chronic care, Medicaid). BAAs, access controls, audit logs, and minimum-necessary handling required. |
| **GLBA** | Financial data | Safeguards Rule: protect nonpublic personal information; privacy notices. |
| **FINRA** | Broker-dealer communications | Communication supervision, review, and recordkeeping of advisor↔client messaging. |
| **SEC** | Investment advisers | Books-and-records and marketing rule considerations; recommendations require documented suitability. |
| **TCPA** | SMS/voice outreach | Prior express (written) consent; time-of-day rules; DNC handling. Consent is modeled and gated. |
| **CAN-SPAM** | Email | Accurate headers, unsubscribe, physical address. |
| **State insurance regs** | Licensing & disclosures | Producer licensing, state-specific disclosures (e.g. Medicare). |
| **Privacy laws** | CCPA/CPRA, state laws | Access, deletion, opt-out; data retention limits. |
| **Carrier requirements** | Per carrier | Contractual data-handling and submission rules. |

## What the skeleton provides

- **Consent modeling & gating** (`consent_records`, `@aion/compliance/consent`): outbound channels require granted, unexpired consent.
- **Audit logging** (`audit_logs`, `buildAuditEvent`): human, automation, and AI actions are recorded with redaction.
- **Disclosures** (`@aion/compliance/disclosures`): placeholder financial, insurance, and Medicare disclosures — **replace with counsel-approved copy**.
- **Advisor-review gates**: product recommendations default to `requires_advisor_review = true`; AI output is labeled and never presented as final advice.
- **Communication approvals** (`communication_approvals`) and workflow approval steps for outbound messaging.
- **Compliance language checker** (`checkComplianceLanguage`) as an advisory pre-send review.
- **Demo-mode safety**: outbound/irreversible actions are blocked in demo mode.

## What must be added operationally

- Executed BAAs (HIPAA) and vendor due diligence for every sub-processor.
- Real, jurisdiction- and product-specific disclosures reviewed by counsel.
- Consent capture UX with written proof and DNC/opt-out enforcement.
- Data retention schedules, export, and deletion-request handling.
- Supervision/review workflows for regulated communications (FINRA/SEC).
- Producer licensing checks by state and product line.
- Incident response, breach notification, and records-retention policies.

Treat everything here as a starting scaffold to be completed under professional
guidance — not a compliance guarantee.
