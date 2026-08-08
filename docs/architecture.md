# Architecture

AION is a modular intelligence and experience layer on top of GoHighLevel. The
application layer owns AI qualification, scoring, workflows, analytics, and the
branded UI; GoHighLevel owns CRM records, communications, calendars, and its own
workflow execution. Everything is multi-tenant and designed for white-label
deployment.

## Design principles

- **GoHighLevel is the system of record for CRM data.** AION never couples UI or
  business logic to raw GHL calls — everything goes through `@aion/ghl`.
- **Provider-agnostic AI.** No component depends on a specific model vendor;
  everything flows through the `@aion/ai` gateway and Zod-validated schemas.
- **Deterministic where it matters.** Lead scoring is pure and reproducible so it
  is explainable and auditable; AI augments but never replaces it.
- **Tenant isolation is enforced in the database (RLS) and re-checked in the app.**
- **Fail safe.** AI output is never trusted without schema validation, and
  automation never triggers irreversible actions without workflow rules or human
  approval.

## 1. Overall system architecture

```mermaid
flowchart TB
    subgraph Client["Client experiences"]
      LP[Landing pages / forms / chatbot]
      WEB[Next.js dashboard - apps/web]
    end

    subgraph AppLayer["AION application layer"]
      API[API route handlers / apps/api]
      WORKER[Worker - workflow engine / apps/worker]
      subgraph Packages["Domain packages"]
        AI[@aion/ai]
        GHL[@aion/ghl]
        WF[@aion/workflows]
        AN[@aion/analytics]
        AUTH[@aion/auth]
        COMP[@aion/compliance]
        INT[@aion/integrations]
      end
    end

    subgraph Data["Data + platform"]
      DB[(Supabase Postgres + RLS)]
      STORE[(Supabase Storage / S3)]
    end

    subgraph External["External services"]
      GHLAPI[GoHighLevel API]
      LLM[AI providers - OpenAI / Anthropic]
      COMMS[Twilio / Telnyx / Email]
    end

    LP -->|webhook| API
    WEB --> API
    API --> Packages
    WORKER --> Packages
    API --> DB
    WORKER --> DB
    API --> STORE
    GHL --> GHLAPI
    AI --> LLM
    INT --> COMMS
    GHLAPI -->|webhooks| API
```

## 2. Lead journey

```mermaid
flowchart LR
    A[Prospect enters] --> B[Captured in GoHighLevel]
    B --> C[Enrich / segment / score]
    C --> D[AI qualification]
    D --> E{Qualified?}
    E -- No --> F[Nurture sequence]
    E -- Yes --> G[Route to pipeline + advisor]
    G --> H[Book appointment]
    H --> I[Advisor prep brief + next action]
    I --> J[Follow-ups / reminders / re-engagement]
    J --> K[Applications / documents / status]
    K --> L[Revenue, policies, metrics on dashboard]
    F --> C
```

## 3. Webhook processing

```mermaid
sequenceDiagram
    participant GHL as GoHighLevel
    participant API as /api/webhooks/ghl
    participant V as Verify (HMAC)
    participant DB as webhook_events (UNIQUE)
    participant WF as Worker / New Lead workflow

    GHL->>API: POST event (raw body + signature)
    API->>V: verifyWebhookSignature(raw, sig, secret)
    V-->>API: valid / invalid
    alt invalid signature
      API-->>GHL: 401
    else valid
      API->>API: webhookIdempotencyKey(event)
      API->>DB: insert (provider, idempotency_key)
      alt duplicate key
        DB-->>API: conflict
        API-->>GHL: 200 duplicate (no-op)
      else new
        DB-->>API: inserted
        API->>WF: enqueue processing
        API-->>GHL: 200 processed
      end
    end
```

## 4. GoHighLevel synchronization

```mermaid
flowchart TB
    subgraph AION
      SVC[Domain services]
      MAP[(external_object_mappings)]
      SYNC[sync_jobs / sync_errors]
    end
    subgraph GHLPKG["@aion/ghl"]
      CLIENT[GHLClient - retry + rate limit + logging]
      SERVICES[Contact / Opportunity / Calendar / Conversation ...]
    end
    GHLAPI[GoHighLevel API]

    SVC --> SERVICES --> CLIENT --> GHLAPI
    SVC --> MAP
    SVC --> SYNC
    GHLAPI -.webhooks.-> SVC
    SYNC -->|retry with backoff| SERVICES
```

## 5. AI qualification flow

```mermaid
flowchart TB
    ANS[Qualification answers] --> SIG[extractSignals - deterministic]
    SIG --> SCORE[computeScore - rule-based]
    ANS --> GW[AI Gateway]
    GW --> PROV{Provider}
    PROV -->|mock| MOCK[Mock provider]
    PROV -->|openai| OAI[OpenAI]
    PROV -->|anthropic| ANT[Anthropic]
    MOCK --> VAL[Zod schema validation]
    OAI --> VAL
    ANT --> VAL
    VAL -->|ok| RESULT[QualificationResult]
    VAL -->|fail| SAFE[Fail safe - rule-based fallback]
    SCORE --> OUT[Score + band + breakdown]
    RESULT --> OUT
    SAFE --> OUT
```

## 6. Multi-tenant authorization

```mermaid
flowchart TB
    REQ[Authenticated request] --> RESOLVE[Resolve active organization]
    RESOLVE --> RBAC[RBAC check - permissionsForRole]
    RBAC --> QUERY[Query with organization_id scope]
    QUERY --> RLS{Postgres RLS: is_org_member?}
    RLS -->|member| ROWS[Rows returned]
    RLS -->|not member| DENY[No rows / denied]
    ROWS --> GUARD[assertSameTenant - app-layer double check]
    GUARD --> RESP[Response]
```

## 7. Workflow execution

```mermaid
stateDiagram-v2
    [*] --> Pending
    Pending --> Running: trigger fires
    Running --> StepRun: next step
    StepRun --> StepRun: retry (transient failure, backoff)
    StepRun --> AwaitingApproval: step.requiresApproval
    AwaitingApproval --> [*]: human resumes later
    StepRun --> Failed: retries exhausted
    StepRun --> Running: step completed
    Running --> Completed: all steps done
    Failed --> [*]
    Completed --> [*]
```

## 8. Data model relationships (core)

```mermaid
erDiagram
    organizations ||--o{ memberships : has
    organizations ||--o{ leads : owns
    organizations ||--|| organization_settings : configures
    profiles ||--o{ memberships : joins
    contacts ||--o{ leads : identifies
    leads ||--o{ lead_scores : scored_by
    leads ||--o{ lead_qualification_sessions : qualified_by
    leads ||--o{ opportunities : creates
    leads ||--o{ appointments : books
    leads ||--o{ applications : submits
    leads ||--o{ conversations : messages
    pipelines ||--o{ pipeline_stages : contains
    pipelines ||--o{ opportunities : holds
    applications ||--o{ policies : becomes
    leads ||--o{ consent_records : consents
    organizations ||--o{ audit_logs : records
    organizations ||--o{ webhook_events : receives
```

See [`database-schema.md`](database-schema.md) for the full table listing.
