# GoHighLevel Integration

All GoHighLevel access is encapsulated in `@aion/ghl`. **No UI component or
business logic calls the GHL API directly** — they depend on typed service
interfaces, so the live client and the in-memory mock are interchangeable.

## Package surface

| Module | Responsibility |
| --- | --- |
| `client.ts` | `GHLClient` — typed HTTP with retry, 429/5xx backoff, request logging, error normalization |
| `types.ts` | Domain types + service interfaces (`GHLContactService`, `GHLOpportunityService`, …) |
| `webhooks.ts` | `verifyWebhookSignature`, `webhookIdempotencyKey`, `parseWebhook` |
| `mock.ts` | `MockGHLServices` — full in-memory implementation for demo + tests |
| `index.ts` | `createGHLServices({ demoMode, accessToken })` factory |

### Service interfaces

```ts
interface GHLContactService {
  createContact(input: CreateContactInput): Promise<GHLContact>;
  updateContact(contactId: string, input: UpdateContactInput): Promise<GHLContact>;
  getContact(contactId: string): Promise<GHLContact>;
  searchContacts(query: ContactSearchInput): Promise<GHLContact[]>;
}
```

Also provided: Opportunity, Pipeline, Calendar, Conversation, Workflow, User,
Location, and Custom Field services, aggregated as `GHLServices`.

## Authentication

Supports OAuth access tokens and private-integration API keys — both are passed
as a bearer token to `GHLClient`. Store credentials **encrypted** in
`integration_connections.encrypted_credentials` (never in plaintext, never in
the client bundle). The OAuth callback route is `GHL_REDIRECT_URI`
(`/api/integrations/ghl/callback`).

## Webhooks

Inbound events hit `/api/webhooks/ghl` (web) or `POST /webhooks/ghl` (api service):

1. **Verify** the HMAC-SHA256 signature over the raw body with `GHL_WEBHOOK_SECRET` (constant-time compare).
2. **Derive** a stable idempotency key (prefers the provider `webhookId`, else a content hash).
3. **Dedupe** via `UNIQUE(provider, idempotency_key)` on `webhook_events` — a repeat delivery is a no-op.
4. **Process** — enqueue the New Lead workflow (upsert contact/lead, qualify, score, route).

## Reliability

- **Retries**: transient (429/5xx/network) errors retry with exponential backoff; `Retry-After` is honored on 429.
- **Rate limits**: handled inside `GHLClient`; callers don't manage it.
- **Errors**: normalized to `AppError('integration_error', …)` so failures are uniform.
- **Logging**: every request is logged (method, path, status, latency, retries) via the `onRequest` hook → `api_usage_logs`.
- **Mapping**: `external_object_mappings` links local entities to GHL ids for two-way sync.

## Going live (replacing the mock)

The MVP returns `MockGHLServices` from `createGHLServices` so it runs offline.
To use a real account:

1. Set `GHL_CLIENT_ID`, `GHL_CLIENT_SECRET`, `GHL_REDIRECT_URI`, `GHL_WEBHOOK_SECRET`, and `GHL_API_BASE_URL`.
2. In `packages/ghl/src/index.ts`, construct client-backed services (wrap `GHLClient` calls behind each interface) and return them when `!demoMode && accessToken`.
3. Register the webhook URL in GoHighLevel and confirm signatures verify.
4. Set `DEMO_MODE=false` so outbound actions are enabled (they are blocked in demo mode by `@aion/compliance`).

Every mocked method is a direct stand-in for a real endpoint; the interface does
not change when you swap implementations.
