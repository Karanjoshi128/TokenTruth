# Product Requirements Document: TruthToken

**Document Version:** 1.0
**Date:** 2026-04-06
**Status:** Draft
**Project Path:** `C:\Users\Karan\Desktop\Projects\NextJs\Fun\tokentruth`

---

## 1. Executive Summary

TruthToken is a privacy-first, browser-based web application that enables developers, engineers, and AI practitioners to instantly verify the validity and operational status of API keys across the major AI/ML provider ecosystem. Unlike generic API testing tools, TruthToken is purpose-built for AI API key verification, providing deep validation results including model access lists, rate limit tiers, quota consumption, and account metadata — all without ever storing a user's credentials on any server.

The application is a Next.js single-page application deployed as a Progressive Web App (PWA). All sensitive operations execute in the browser or via lightweight, stateless server-side proxy routes that discard keys immediately after forwarding the validation request. History and results persist exclusively in the user's `localStorage`.

---

## 2. Problem Statement

### 2.1 The Core Problem

Developers working with multiple AI providers face a recurring operational pain point: **they cannot quickly determine whether an API key is valid, which capabilities it unlocks, and what its current quota/rate-limit status is** without either:

1. Writing throwaway code for each provider's specific auth model
2. Navigating multiple provider dashboards
3. Making a real API call and interpreting cryptic error messages
4. Trusting that a key "should still work" without verification

This problem compounds significantly when:
- Teams share keys via secrets managers and need to audit which keys are still active
- Developers receive keys from clients and need rapid triage before starting work
- CI/CD pipelines fail and the root cause might be an expired or rate-limited key
- Freelancers and contractors manage keys across dozens of projects

### 2.2 Existing Alternatives Fall Short

| Tool | Gap |
|---|---|
| Provider dashboards | Requires login, shows one provider at a time, no batch support |
| Postman / Insomnia | Requires manual request crafting per provider, no structured output |
| curl scripts | No UI, requires technical knowledge, not shareable |
| Generic API testers | No AI-provider awareness, no semantic result interpretation |
| `dotenv-vault` / similar | Manages secrets but doesn't validate them |

### 2.3 Why Now

The AI API provider landscape has fragmented significantly since 2023. As of 2026, most engineering teams use 3-7 different AI providers simultaneously. The cognitive overhead and time cost of multi-provider key management has become a real productivity bottleneck.

---

## 3. Goals & Non-Goals

### 3.1 Goals

- **G1:** Provide instant, accurate pass/fail validation for API keys from 12+ AI providers
- **G2:** Surface rich validation metadata (model lists, tiers, quotas, org info) beyond simple auth checks
- **G3:** Guarantee zero server-side key storage — privacy as a hard constraint, not a feature
- **G4:** Support batch testing of up to 50 keys simultaneously
- **G5:** Enable results export (JSON, CSV) for audit trails and documentation
- **G6:** Deliver a polished, keyboard-driven, accessible UI that works on mobile and desktop
- **G7:** Ship as a PWA usable offline (for the UI shell) and installable on desktop/mobile
- **G8:** Auto-detect provider from key format to remove user friction

### 3.2 Non-Goals

- **NG1:** This is NOT a secrets manager — TruthToken will not store, rotate, or manage keys
- **NG2:** This is NOT an API playground — it will not let users craft arbitrary API requests
- **NG3:** This is NOT a monitoring service — there is no scheduled/recurring validation, no alerting
- **NG4:** This is NOT a team collaboration tool — all data is local-only, no accounts, no sharing
- **NG5:** This will NOT support non-AI APIs (no Stripe, Twilio, GitHub, etc.) in v1
- **NG6:** This will NOT provide key generation or provisioning
- **NG7:** This will NOT implement OAuth flows — only static API key validation

---

## 4. User Personas

### Persona 1: "The AI Engineer" — Primary User
- **Name:** Priya, 31, Senior ML Engineer at a mid-size startup
- **Context:** Works with 5-6 AI providers daily. Her team rotates keys quarterly. Every rotation causes 1-2 hours of debugging time across environments.
- **Goals:** Instantly verify a new key works before deploying it. Check which models a key has access to.
- **Pain Points:** Has to write a quick Python script every time to test a new key. Frequently forgets provider-specific auth header formats.
- **Key Behaviors:** Lives in the terminal, values keyboard shortcuts, dark mode by default, exports results to paste into Notion tickets.
- **Success Metric:** Goes from "I got a new key" to "I know it works and what it can do" in under 30 seconds.

### Persona 2: "The Freelance Developer" — Power User
- **Name:** Marcus, 27, Independent AI Consultant
- **Context:** Manages API keys for 15+ clients across OpenAI, Anthropic, and Google. Clients send him keys via email and Slack. He needs to triage them immediately.
- **Goals:** Batch-test multiple client keys at once. Export results as proof-of-validation for client reports.
- **Pain Points:** Has no centralized place to test keys. Accidentally used an invalid key in a client demo once — career-damaging moment.
- **Key Behaviors:** Uses the app weekly in batches. Needs CSV export to paste into client status spreadsheets. Mobile-first because he's often on the go.
- **Success Metric:** Can validate 10 client keys and export a CSV in under 2 minutes.

### Persona 3: "The Platform Engineer" — Occasional User
- **Name:** Soo-Jin, 34, DevOps Lead
- **Context:** Maintains a secrets vault for an engineering organization of 40. Needs periodic audits to ensure keys in the vault are still valid.
- **Goals:** Paste in a batch of keys (redacted in UI), get a structured report on validity status.
- **Pain Points:** Currently runs a bespoke script that breaks whenever a provider changes their API response format.
- **Key Behaviors:** Uses the app monthly. Needs reliable JSON export. Cares about security model — will not use any tool that phones keys home.
- **Success Metric:** Completes a 20-key audit in one session with a machine-readable JSON export.

### Persona 4: "The Curious Developer" — Casual User
- **Name:** Amir, 22, CS Student / Hobbyist
- **Context:** Experimenting with AI APIs for the first time. Got a free-tier key from OpenAI and isn't sure if it's still valid.
- **Goals:** Quick sanity check that his key works. Understand what models he has access to.
- **Pain Points:** Intimidated by API documentation. Doesn't know how to test an API key without writing code.
- **Key Behaviors:** One-time or infrequent user. Needs a very clear, guided UI. Mobile user.
- **Success Metric:** Successfully validates a key without reading any documentation.

---

## 5. Core Features

### Priority Framework
- **P0:** Must ship in v1.0 — product is non-functional without these
- **P1:** Should ship in v1.0 — major user value, acceptable to delay to v1.1 if needed
- **P2:** Nice-to-have — planned for future releases

### 5.1 Feature Table

| ID | Feature | Priority | Description |
|---|---|---|---|
| F-01 | Single Key Validator | P0 | Paste one key, get validation results |
| F-02 | Provider Auto-Detection | P0 | Infer provider from key prefix/format |
| F-03 | Provider Manual Override | P0 | User can correct auto-detected provider |
| F-04 | Validation Result Display | P0 | Rich results panel with model list, quota, metadata |
| F-05 | Key Masking in UI | P0 | Never show full key in results or history |
| F-06 | Security Model | P0 | Client-side first; server proxy only for CORS-blocked providers; zero storage |
| F-07 | Batch Key Testing | P1 | Test up to 50 keys in parallel or sequential queue |
| F-08 | Local History | P1 | localStorage-persisted history of past validation runs |
| F-09 | Export Results (JSON/CSV) | P1 | Download validation results as structured files |
| F-10 | Copy to Clipboard | P1 | One-click copy for result summaries |
| F-11 | Dark / Light Mode | P1 | System default with manual toggle |
| F-12 | Provider Status Integration | P1 | Show live provider outage status alongside results |
| F-13 | PWA Support | P1 | Installable app, offline UI shell |
| F-14 | Keyboard Shortcuts | P1 | Power-user keyboard navigation |
| F-15 | Mobile Responsive UI | P1 | Full functionality on viewport widths >= 375px |
| F-16 | Real-Time Progress Indicators | P1 | Live status during validation (pending, loading, success, error) |
| F-17 | Result Sharing via URL | P2 | Shareable URL with encoded (non-sensitive) result summary |
| F-18 | Rate Limit Visualizer | P2 | Visual gauge of quota consumption |
| F-19 | Key Diff Tool | P2 | Compare two validation results side by side |
| F-20 | Provider Status History | P2 | Cached historical uptime for providers |

---

## 6. Detailed Feature Specifications

### 6.1 F-01: Single Key Validator

**Interaction Flow:**
1. User lands on homepage — a centered input area is immediately in focus
2. User pastes or types an API key into the primary input field
3. If auto-detect fires (F-02), a provider badge appears inline within ~200ms
4. User clicks "Validate" or presses `Enter`
5. A loading state replaces the button; progress indicator appears
6. Results panel slides in below (or replaces input on mobile) with full detail

**Input Field Behavior:**
- Type: `<textarea>` with single-line appearance (allows paste of long keys)
- `autocomplete="off"`, `autocorrect="off"`, `autocapitalize="off"`, `spellcheck="false"`
- Key is masked after the first 8 characters: `sk-proj-XXXX...XXXX` (show first 4 + last 4, mask the rest)
- Masking is visual only — the actual value is retained in component state for the API call
- Clear button (X icon) resets the field and result panel

**Validation Trigger:**
- Primary: "Validate Key" button
- Secondary: `Enter` key when input is focused
- Debounce: 300ms to prevent accidental double-submission
- Disable button during in-flight request

### 6.2 F-02: Provider Auto-Detection

Auto-detection runs on every keystroke (debounced at 150ms) via a purely client-side pattern-matching engine. No network call is made during detection.

**Detection Pattern Registry:**

| Provider | Key Prefix / Pattern | Confidence |
|---|---|---|
| OpenAI | `sk-` (legacy) or `sk-proj-` (project keys) | High |
| Anthropic | `sk-ant-` | High |
| Google Gemini | `AIza` followed by 35 alphanumeric chars | High |
| Cohere | No standard prefix; 40-char alphanumeric | Low (length heuristic) |
| Hugging Face | `hf_` | High |
| Mistral | No strong prefix; UUID-like format (`xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`) | Medium |
| Groq | `gsk_` | High |
| Together AI | No strong prefix; long alphanumeric string | Low |
| Replicate | `r8_` | High |
| AWS Bedrock | `AKIA` (Access Key ID) paired with secret key | High (pair detection) |
| Perplexity | `pplx-` | High |
| xAI (Grok) | `xai-` | High |
| Fireworks AI | `fw_` prefix | High |
| DeepSeek | `sk-` prefix (conflates with OpenAI — flagged) | Ambiguous |

**Ambiguity Handling:**
- When multiple providers could match (e.g., `sk-` prefix), display a disambiguation UI: "This looks like an OpenAI or DeepSeek key. Please confirm your provider."
- User selects provider from a compact dropdown; selection is remembered for that session
- AWS Bedrock requires two fields (Access Key ID + Secret Access Key) — switching to Bedrock reveals a second input field dynamically

**Detection State Badges:**
- Detected with high confidence: Provider logo + name, solid green border on input
- Detected with low confidence: Provider logo + name with "?" indicator, yellow border
- Ambiguous: Multiple provider chips shown, amber border
- Unknown: "Unknown provider" with option to manually select, gray border

### 6.3 F-03: Provider Manual Override

A provider selector (combobox/searchable dropdown) is always visible beneath the input. It is pre-populated by auto-detection but fully user-editable. The dropdown shows provider logos, names, and a confidence indicator when auto-detected.

### 6.4 F-04: Validation Result Display

Results are organized into a structured card with collapsible sections.

**Result Card Structure:**

```
[Provider Logo] [Provider Name]          [VALID / INVALID badge]
Key: sk-proj-XXXX...ab3f
Validated: 2026-04-06 18:23:41 UTC       [Copy] [Re-validate]

> Account & Organization
  - Organization ID: org-XXXXXXXXXX
  - Account Email: p***@example.com (masked)
  - Account Type: Pay-as-you-go / Free Tier / Enterprise
  - Has Payment Method: Yes / No

> Model Access  [expandable list]
  - gpt-4o                  [Available]
  - gpt-4o-mini             [Available]
  - gpt-4-turbo             [Available]
  - o1-preview              [Not available for this key]
  - dall-e-3                [Available]

> Quota & Rate Limits
  - Tier: Tier 4
  - RPM (Requests/min): 10,000
  - TPM (Tokens/min): 2,000,000
  - Used this period: 45% [visual bar]

> Provider Status
  - API Status: Operational [green dot]
  - Last incident: None in past 7 days
```

**Result States:**
- `VALID` — green badge, full metadata shown
- `INVALID` — red badge, error code + human-readable explanation shown, suggestions offered
- `QUOTA_EXCEEDED` — orange badge, key is structurally valid but currently rate-limited
- `PERMISSION_ERROR` — yellow badge, key is valid but lacks permissions for the test endpoint
- `PROVIDER_DOWN` — gray badge, cannot determine validity due to provider outage
- `TIMEOUT` — red badge, request exceeded 10-second threshold

**Invalid Key Error Messages (Human-Readable):**
Rather than showing raw HTTP status codes, TruthToken translates provider error responses into plain language:
- `401 Unauthorized` → "This key is not recognized by [Provider]. It may have been revoked, was never valid, or was entered with a typo."
- `403 Forbidden` → "This key exists but does not have permission to access the test endpoint. It may be scoped to specific resources."
- `429 Too Many Requests` → "This key has exceeded its current rate limit or monthly quota. Try again after the reset window."
- `500/502/503` → "Provider servers are experiencing issues. This does not indicate key invalidity."

### 6.5 Provider-Specific Validation Strategies

Each provider requires a different minimal API call strategy to produce the richest validation signal with the smallest possible request cost.

---

#### 6.5.1 OpenAI

**Validation Endpoint:** `GET https://api.openai.com/v1/models`

**Auth Header:** `Authorization: Bearer {key}`

**Why this endpoint:** The `/models` endpoint is unauthenticated for the request structure but requires a valid key, is read-only, has no cost, and returns the full model list the key can access.

**Additional Calls (conditional):**
- `GET https://api.openai.com/v1/organizations` — fetch org ID and account metadata
- The response headers include `x-ratelimit-limit-requests`, `x-ratelimit-remaining-requests`, `x-ratelimit-reset-requests` — parse these for quota display

**Data Extracted:**
- Model list (filter to `owned_by: openai`)
- Organization ID from response or auth header reflection
- Rate limit tier inferred from RPM/TPM headers (OpenAI tier table is public knowledge)
- `x-request-id` header for traceability

**Key Format Variants:**
- Legacy: `sk-[48 alphanumeric]`
- Project keys: `sk-proj-[alphanumeric string]`
- Service account keys: `sk-svcacct-[alphanumeric string]`
- Admin keys: `sk-admin-[alphanumeric string]`

**Edge Cases:**
- Project keys may have model restrictions — the model list will reflect the project's policy
- Organization keys may return org-level metadata vs. project-level

---

#### 6.5.2 Anthropic

**Validation Endpoint:** `GET https://api.anthropic.com/v1/models`

**Auth Header:** `x-api-key: {key}`, also requires `anthropic-version: 2023-06-01`

**Why this endpoint:** Returns all models accessible to the key. Read-only, no token cost.

**Additional Data:**
- Response includes `has_more` pagination and model IDs — parse full list
- Anthropic does not expose rate limit info in headers publicly; tier is inferred from model access (Claude 3 Opus access implies Tier 3+)
- Check for `claude-3-5-sonnet`, `claude-3-7-sonnet`, `claude-opus-4` availability as tier proxies

**Data Extracted:**
- Full model list with `display_name` and `created_at`
- Inferred tier based on model access
- API version compatibility

**Key Format:** `sk-ant-api03-[base64-like string of ~96 chars]`

---

#### 6.5.3 Google Gemini (Google AI Studio)

**Validation Endpoint:** `GET https://generativelanguage.googleapis.com/v1beta/models?key={key}`

**Auth Method:** Query parameter (`?key=`)

**Why this endpoint:** Lists all available Gemini models for the key. No cost, read-only.

**Additional Data:**
- Model list with `supportedGenerationMethods`
- Check for Gemini 2.0, Gemini 1.5 Pro, Gemini 1.5 Flash access

**Key Format:** `AIza[35 alphanumeric chars]` — total length 39 characters

**Edge Cases:**
- Google AI Studio keys are project-scoped; billing status affects model availability
- Keys without billing may only access Gemini Flash (free tier)
- Distinguish between AI Studio keys and Vertex AI service account credentials (different format entirely — JSON credential file, not in scope for v1)

---

#### 6.5.4 Cohere

**Validation Endpoint:** `GET https://api.cohere.com/v2/models`

**Auth Header:** `Authorization: Bearer {key}`

**Why this endpoint:** Returns model list, read-only, no cost.

**Additional Data:**
- `GET https://api.cohere.com/v1/check-api-key` — Cohere provides an explicit key check endpoint returning `{"valid": true/false}`
- Use the explicit endpoint first; fall back to models endpoint for metadata

**Data Extracted:**
- Validity boolean from `/check-api-key`
- Model access list
- Account type (Trial vs. Production)

**Key Format:** 40-character alphanumeric string, no distinctive prefix

---

#### 6.5.5 Hugging Face

**Validation Endpoint:** `GET https://huggingface.co/api/whoami-v2`

**Auth Header:** `Authorization: Bearer {key}`

**Why this endpoint:** Purpose-built whoami endpoint returns user identity and token permissions.

**Data Extracted:**
- `name` (username)
- `email` (masked in display)
- `type`: user vs. org
- `auth.accessToken.role`: read, write, admin
- `auth.accessToken.fineGrained`: scoped permissions if fine-grained token
- `orgs`: list of organizations the token belongs to

**Key Format:** `hf_[alphanumeric ~37 chars]`

**Note:** Hugging Face tokens can be "fine-grained" (scoped to specific repos/operations) or classic. Distinguish these in the results display.

---

#### 6.5.6 Mistral AI

**Validation Endpoint:** `GET https://api.mistral.ai/v1/models`

**Auth Header:** `Authorization: Bearer {key}`

**Data Extracted:**
- Model list (Mistral 7B, Mixtral 8x7B, Mistral Large, Mistral Small, Codestral, etc.)
- Rate limit headers if present

**Key Format:** UUID-format string (`xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

---

#### 6.5.7 Groq

**Validation Endpoint:** `GET https://api.groq.com/openai/v1/models`

**Auth Header:** `Authorization: Bearer {key}`

**Why this endpoint:** Groq uses OpenAI-compatible API format. Models endpoint is read-only and returns model list.

**Data Extracted:**
- Available models (Llama 3, Mixtral, Gemma variants)
- Rate limit headers: `x-ratelimit-limit-requests`, `x-ratelimit-remaining-requests`, `x-ratelimit-limit-tokens`

**Key Format:** `gsk_[alphanumeric ~52 chars]`

---

#### 6.5.8 Together AI

**Validation Endpoint:** `GET https://api.together.xyz/v1/models`

**Auth Header:** `Authorization: Bearer {key}`

**Data Extracted:**
- Full model catalog (Together hosts 100+ models)
- Filter to show categories: Language, Image, Code, Embedding
- Show total count rather than listing all models (collapse by default)

**Key Format:** Long alphanumeric string, ~64 characters, no standard prefix

---

#### 6.5.9 Replicate

**Validation Endpoint:** `GET https://api.replicate.com/v1/account`

**Auth Header:** `Authorization: Bearer {key}`

**Why this endpoint:** Returns account info directly — username, account type, GitHub login.

**Data Extracted:**
- `username`
- `name`
- `github_url`
- `type`: `user` or `organization`

**Key Format:** `r8_[alphanumeric ~40 chars]`

---

#### 6.5.10 AWS Bedrock

**Special Handling:** AWS requires two credentials — an Access Key ID and a Secret Access Key — plus an optional session token for temporary credentials and a region selection.

**UI Behavior:**
- When Bedrock is selected (or detected via `AKIA` prefix), the input area expands to show:
  - Access Key ID field
  - Secret Access Key field (masked by default, toggle to reveal)
  - Session Token field (optional, collapsed by default)
  - Region selector (dropdown, defaults to `us-east-1`)

**Validation Approach:**
- Use AWS Signature Version 4 signing, implemented client-side using the AWS SDK for JavaScript (v3, tree-shakeable)
- Call `ListFoundationModels` on `bedrock.{region}.amazonaws.com`
- This is the least-cost, read-only call that validates credentials AND returns model access

**Data Extracted:**
- Foundation model list with `modelName`, `providerName`, `responseStreamingSupported`
- IAM identity from STS `GetCallerIdentity` — returns Account ID, ARN, User ID
- Region availability

**Security Note:** AWS Secret Access Key is never sent to TruthToken servers. The Signature V4 signing (HMAC-SHA256) is performed entirely in the browser using the AWS SDK.

---

#### 6.5.11 Perplexity AI

**Validation Endpoint:** `POST https://api.perplexity.ai/chat/completions`

**Auth Header:** `Authorization: Bearer {key}`

**Why POST:** Perplexity does not expose a models list or account endpoint publicly; the cheapest validation is a minimal chat completion with `max_tokens: 1`

**Request Body:**
```json
{
  "model": "sonar",
  "messages": [{"role": "user", "content": "hi"}],
  "max_tokens": 1
}
```

**Cost:** Minimal (1 token generation) — display a notice: "Perplexity validation uses 1 API token."

**Key Format:** `pplx-[alphanumeric ~48 chars]`

---

#### 6.5.12 xAI (Grok)

**Validation Endpoint:** `GET https://api.x.ai/v1/models`

**Auth Header:** `Authorization: Bearer {key}`

**Data Extracted:**
- Available Grok model variants
- Rate limit headers if present

**Key Format:** `xai-[alphanumeric ~80+ chars]`

---

#### 6.5.13 Fireworks AI

**Validation Endpoint:** `GET https://api.fireworks.ai/inference/v1/models`

**Auth Header:** `Authorization: Bearer {key}`

**Key Format:** `fw_[alphanumeric]`

---

#### 6.5.14 DeepSeek

**Validation Endpoint:** `GET https://api.deepseek.com/models`

**Auth Header:** `Authorization: Bearer {key}`

**Disambiguation:** DeepSeek uses `sk-` prefix, same as OpenAI. When `sk-` is detected, show disambiguation UI. Heuristic: DeepSeek keys are typically shorter and lack the `proj`, `svcacct`, or `admin` sub-prefix.

---

### 6.6 F-05: Key Masking

- In the input field: show first 8 characters + `...` + last 4 characters after a 2-second idle period
- In all result displays and history: always masked
- In exports: configurable — default is masked, with a toggle to "include full keys in export" (with a clear warning)
- Copy-to-clipboard behavior: copies the masked representation by default; a separate "copy full key" button (with confirmation dialog) copies the actual key while still in the current session
- When navigating away from the page, full keys are not retained in any form

### 6.7 F-07: Batch Key Testing

**Input Methods:**
1. Multi-line textarea — one key per line
2. CSV upload — paste or drag-drop a CSV where one column contains keys (column auto-detected)
3. JSON upload — array of key strings or objects with `key` field

**Batch Limits:**
- Maximum 50 keys per batch (P0 constraint)
- Keys over the limit trigger a warning with an option to process first 50 only

**Execution Strategy:**
- Keys are processed in parallel with a configurable concurrency limit (default: 5 concurrent validations)
- Each key shows an individual status card with real-time state: `Queued`, `Validating...`, `Valid`, `Invalid`, `Error`
- A global progress bar shows `n / total` completed
- Individual results appear as they complete (streaming UI updates)
- Failed validations do not block remaining keys

**Batch Result Summary:**
```
Batch Results — 2026-04-06 18:30 UTC
Total: 25 keys
Valid: 18 (72%)
Invalid: 5 (20%)
Errors: 2 (8%)

[Export All as JSON] [Export All as CSV] [Copy Summary]
```

### 6.8 F-08: Local History

**Storage:** `localStorage` key: `truthtoken_history`

**Data Structure per History Entry:**
```json
{
  "id": "uuid-v4",
  "timestamp": "2026-04-06T18:23:41Z",
  "provider": "openai",
  "keyMasked": "sk-proj-XXXX...ab3f",
  "result": "valid",
  "metadata": {
    "modelCount": 12,
    "tier": 4,
    "orgId": "org-XXXXXXXXXX"
  },
  "isBatch": false,
  "batchSize": null
}
```

Note: Full key is NEVER stored in history. Only the masked representation.

**History UI:**
- Accessible via a "History" tab or sidebar panel
- Grouped by date (Today, Yesterday, This Week, Older)
- Searchable/filterable by provider, result status
- Each entry has "Re-validate" (pastes masked key — user must re-enter full key) and "Delete" actions
- "Clear all history" with confirmation dialog
- History cap: 500 entries; oldest entries auto-purged when cap is exceeded

### 6.9 F-09: Export Results

**Formats:**

JSON export:
```json
{
  "exported_at": "2026-04-06T18:30:00Z",
  "version": "1.0",
  "results": [
    {
      "provider": "openai",
      "key_masked": "sk-proj-XXXX...ab3f",
      "status": "valid",
      "validated_at": "2026-04-06T18:23:41Z",
      "models_available": ["gpt-4o", "gpt-4o-mini", "dall-e-3"],
      "tier": 4,
      "org_id": "org-XXXXXXXXXX",
      "rpm_limit": 10000,
      "tpm_limit": 2000000
    }
  ]
}
```

CSV export column order: `provider, key_masked, status, validated_at, models_available (semicolon-separated), tier, org_id, error_message`

**Export Options Dialog:**
- Include full keys: checkbox (default unchecked, shows warning when checked)
- Format: JSON / CSV radio
- Scope: Current result only / All results from session / Full history

### 6.10 F-11: Provider Status Integration

TruthToken fetches provider status from public status pages via their APIs or RSS/Atom feeds.

**Status Sources:**

| Provider | Status URL |
|---|---|
| OpenAI | `https://status.openai.com/api/v2/status.json` |
| Anthropic | `https://status.anthropic.com/api/v2/status.json` |
| Google | `https://www.googledisplay.com/incidents.json` (via public API) |
| Groq | `https://groqstatus.com/api/v2/status.json` |
| Hugging Face | `https://status.huggingface.co/api/v2/status.json` |
| Others | Generic HTTP check on their API base URL |

**Status Display:**
- In the provider selector dropdown: a colored dot (green/yellow/red) next to each provider
- In the result card: a "Provider Status" section with current status and recent incidents
- If provider is experiencing an outage and validation fails: prominently display "Provider is currently reporting an outage — key validity could not be determined"
- Status is cached for 5 minutes to avoid hammering status APIs

### 6.11 F-13: PWA Support

**Manifest:**
```json
{
  "name": "TruthToken",
  "short_name": "TruthToken",
  "description": "Instant API key validator for AI providers",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#0f172a",
  "background_color": "#0f172a",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

**Service Worker Strategy:**
- Cache-first for static assets (app shell)
- Network-first for validation API calls (no caching of API responses)
- Offline fallback page: "TruthToken requires an internet connection to validate keys. The app shell is available offline."
- Use `next-pwa` or `@ducanh2912/next-pwa` package

### 6.12 F-14: Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `/` or `Cmd/Ctrl + K` | Focus main key input |
| `Enter` | Trigger validation (when input focused) |
| `Cmd/Ctrl + Enter` | Trigger validation from anywhere |
| `Cmd/Ctrl + B` | Open batch input |
| `Cmd/Ctrl + H` | Toggle history panel |
| `Cmd/Ctrl + E` | Export current results |
| `Cmd/Ctrl + D` | Toggle dark/light mode |
| `Cmd/Ctrl + ,` | Open settings |
| `Esc` | Clear input / close panels |
| `Tab` | Navigate between result sections |

**Keyboard Shortcut Help Modal:** Triggered by `?` key or via a "⌨" icon in the footer.

---

## 7. UX/UI Requirements

### 7.1 Design Principles

1. **Key-first:** The primary key input is always the most prominent element on screen. Nothing competes with it visually on the landing state.
2. **Progressive disclosure:** Validation results expand from minimal (pass/fail badge) to rich (all metadata) — user controls depth.
3. **Respectful of security anxiety:** The UI should constantly signal that keys are safe — masking is visible and obvious, no ambiguous upload progress indicators.
4. **Zero learning curve for basics:** A first-time user should be able to validate a key within 10 seconds without reading any instructions.

### 7.2 Layout Structure

**Desktop (>= 1024px):**
```
[Header: Logo | Mode Toggle | Shortcuts | History]
[Main Content Area - 2 column on results]
  [Left: Input + Provider + Validate button]
  [Right: Result card (appears after validation)]
[Footer: Security notice | GitHub | Docs]
```

**Tablet (768px–1023px):**
```
[Header]
[Single column, full-width input]
[Result card below input, collapsible]
[Footer]
```

**Mobile (< 768px):**
```
[Minimal header: Logo + Mode toggle]
[Input area: full-screen focus mode when active]
[Result: full-screen overlay or sheet]
[Bottom navigation: Home | History | Settings]
```

### 7.3 Color System

**Dark Mode (default):**
- Background: `#0f172a` (Slate 900)
- Surface: `#1e293b` (Slate 800)
- Border: `#334155` (Slate 700)
- Text Primary: `#f8fafc` (Slate 50)
- Text Secondary: `#94a3b8` (Slate 400)
- Accent: `#6366f1` (Indigo 500) — primary action color
- Valid: `#22c55e` (Green 500)
- Invalid: `#ef4444` (Red 500)
- Warning: `#f59e0b` (Amber 500)
- Info: `#3b82f6` (Blue 500)

**Light Mode:**
- Background: `#f8fafc` (Slate 50)
- Surface: `#ffffff`
- Border: `#e2e8f0` (Slate 200)
- Text Primary: `#0f172a` (Slate 900)
- Text Secondary: `#64748b` (Slate 500)
- Accent: `#4f46e5` (Indigo 600)
- Valid/Invalid/Warning/Info: same hues, slightly darker

### 7.4 Typography

- Font: `Inter` (Google Fonts) — clean, developer-friendly sans-serif
- Monospace (for keys and code): `JetBrains Mono` or `Fira Code`
- Scale: Tailwind CSS default type scale
- Key display always uses monospace font

### 7.5 Component Library

Built with **shadcn/ui** on top of **Radix UI** primitives and **Tailwind CSS**. This gives:
- Accessible components (WCAG 2.1 AA compliant) out of the box
- Full design system customizability
- No dependency on a third-party design system runtime

**Key Components:**
- `KeyInput` — custom textarea with masking and provider badge
- `ProviderSelector` — combobox with logos, search, status dots
- `ValidationResult` — collapsible card with section tabs
- `BatchUploader` — multi-line input + drag-drop zone
- `HistoryPanel` — slide-out drawer on desktop, bottom sheet on mobile
- `ExportDialog` — modal with format/scope options
- `StatusDot` — animated pulse indicator for provider status
- `ProgressBar` — batch progress visualization
- `ShortcutModal` — keyboard shortcut reference

### 7.6 Motion Design

- Use `framer-motion` for result panel entrance (slide-in from bottom on mobile, fade-in from right on desktop)
- Respect `prefers-reduced-motion` media query — disable all animations when set
- Loading spinner: minimal CSS-only spinner, not a heavy lottie animation
- Status badge transitions: gentle color crossfade, 200ms

### 7.7 Accessibility Requirements

- All interactive elements must be keyboard navigable
- All images/icons must have descriptive `aria-label` attributes
- Form validation errors must be announced via `aria-live` regions
- Color is never the sole means of conveying status (always paired with icon or text)
- Focus indicators must be clearly visible (no `outline: none` without replacement)
- Screen reader test target: NVDA + Firefox, VoiceOver + Safari

---

## 8. Technical Architecture

### 8.1 Project Structure

```
tokentruth/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx                # Root layout (theme provider, metadata)
│   │   ├── page.tsx                  # Main validator page
│   │   ├── history/
│   │   │   └── page.tsx              # History page (or route-based panel)
│   │   └── api/
│   │       └── validate/
│   │           └── route.ts          # Server-side proxy (CORS-blocked providers)
│   ├── components/
│   │   ├── ui/                       # shadcn/ui base components
│   │   ├── key-input/
│   │   │   ├── KeyInput.tsx
│   │   │   └── ProviderBadge.tsx
│   │   ├── validation/
│   │   │   ├── ValidationResult.tsx
│   │   │   ├── ModelAccessList.tsx
│   │   │   ├── QuotaDisplay.tsx
│   │   │   └── MetadataPanel.tsx
│   │   ├── batch/
│   │   │   ├── BatchUploader.tsx
│   │   │   ├── BatchResultList.tsx
│   │   │   └── BatchProgress.tsx
│   │   ├── history/
│   │   │   ├── HistoryPanel.tsx
│   │   │   └── HistoryEntry.tsx
│   │   ├── export/
│   │   │   └── ExportDialog.tsx
│   │   └── layout/
│   │       ├── Header.tsx
│   │       ├── Footer.tsx
│   │       └── ModeToggle.tsx
│   ├── lib/
│   │   ├── validators/               # Per-provider validation logic
│   │   │   ├── index.ts              # Registry and dispatcher
│   │   │   ├── openai.ts
│   │   │   ├── anthropic.ts
│   │   │   ├── gemini.ts
│   │   │   ├── cohere.ts
│   │   │   ├── huggingface.ts
│   │   │   ├── mistral.ts
│   │   │   ├── groq.ts
│   │   │   ├── together.ts
│   │   │   ├── replicate.ts
│   │   │   ├── bedrock.ts
│   │   │   ├── perplexity.ts
│   │   │   ├── xai.ts
│   │   │   ├── fireworks.ts
│   │   │   └── deepseek.ts
│   │   ├── detection/
│   │   │   ├── index.ts              # Auto-detection engine
│   │   │   └── patterns.ts           # Key format pattern registry
│   │   ├── history/
│   │   │   └── store.ts              # localStorage CRUD
│   │   ├── export/
│   │   │   ├── json.ts
│   │   │   └── csv.ts
│   │   ├── status/
│   │   │   └── providers.ts          # Provider status fetching + cache
│   │   ├── masking.ts                # Key masking utilities
│   │   └── types.ts                  # Shared TypeScript types
│   ├── hooks/
│   │   ├── useValidation.ts          # Validation state machine
│   │   ├── useBatch.ts               # Batch processing logic
│   │   ├── useHistory.ts             # History read/write
│   │   ├── useProviderStatus.ts      # Status polling hook
│   │   └── useKeyboardShortcuts.ts   # Global shortcut registration
│   └── stores/
│       └── appStore.ts               # Zustand global state
├── public/
│   ├── manifest.json
│   ├── icon-192.png
│   ├── icon-512.png
│   └── sw.js                         # Service worker (generated by next-pwa)
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

### 8.2 Data Flow Architecture

**Single Key Validation Flow:**
```
User Input (browser)
    |
    v
Detection Engine (client-side, synchronous)
    |
    v
[Provider identified] --> ProviderValidator (client-side)
    |                           |
    |                    [CORS-allowed?]
    |                    Yes |      No |
    |               Direct fetch    Server-side proxy (/api/validate)
    |                    |                  |
    |                    v                  v
    |              Provider API       Provider API
    |                    |                  |
    |                    +------------------+
    |                           |
    v                           v
    AppStore <---------- Response Parser
    |
    v
Result Display (React component re-render)
    |
    v
History Store (localStorage write)
```

**Batch Flow:**
```
Batch Input (n keys)
    |
    v
Parse & Validate Input Format
    |
    v
Queue (n items, max concurrency: 5)
    |
    v
[Worker slots 1-5 in parallel]
Each slot: same as Single Key Flow above
    |
    v
Results streamed to BatchResultList (React)
    |
    v
Summary aggregation + export offered
```

### 8.3 State Management

**Tool: Zustand** (lightweight, no boilerplate)

**Store Slices:**
- `validationSlice`: current key, detected provider, validation status, result
- `batchSlice`: batch input, job queue, per-key results, aggregate stats
- `historySlice`: history entries array (synced to localStorage)
- `uiSlice`: dark/light mode, panel open states, active shortcuts
- `statusSlice`: provider status cache with timestamps

### 8.4 API Routes (Next.js Route Handlers)

**Route: `POST /api/validate`**

This route exists solely to handle providers whose APIs block direct browser requests via CORS policy. It is a thin, stateless proxy.

**Contract:**
```typescript
// Request
type ProxyRequest = {
  provider: SupportedProvider;
  endpoint: string;            // Full URL to forward to
  method: "GET" | "POST";
  headers: Record<string, string>;  // Auth headers — forwarded directly
  body?: string;               // JSON body for POST requests
}

// Response
type ProxyResponse = {
  ok: boolean;
  status: number;
  headers: Record<string, string>;  // Relevant response headers only
  data: unknown;
}
```

**Critical Security Constraints for Proxy Route:**
1. `endpoint` must be on an allowlist of valid provider base URLs — no SSRF
2. Only allowed headers are forwarded: no internal headers, no cookies
3. Route has a hard 10-second timeout
4. Rate limited: 60 requests/minute per IP
5. The route logs nothing — no request body, no headers, no IPs to any persistence layer
6. Response body is forwarded verbatim; TruthToken server never parses or stores it

**Providers using the proxy (CORS-blocked):**
- Anthropic (blocks browser origins)
- AWS Bedrock (SigV4 signing + CORS restrictions)
- Cohere (check endpoint may require proxy)
- Perplexity (CORS restrictions)

**Providers with direct browser fetch (CORS-allowed):**
- OpenAI
- Google Gemini
- Hugging Face
- Mistral
- Groq
- Together AI
- Replicate
- xAI

### 8.5 Key Dependencies

```json
{
  "dependencies": {
    "next": "^15.x",
    "react": "^19.x",
    "react-dom": "^19.x",
    "tailwindcss": "^4.x",
    "framer-motion": "^11.x",
    "zustand": "^5.x",
    "@aws-sdk/client-bedrock": "^3.x",
    "@aws-sdk/client-sts": "^3.x",
    "next-pwa": "^5.x",
    "papaparse": "^5.x",
    "uuid": "^10.x"
  },
  "devDependencies": {
    "typescript": "^5.x",
    "@types/react": "^19.x",
    "@types/node": "^22.x",
    "eslint": "^9.x",
    "prettier": "^3.x"
  }
}
```

Note: shadcn/ui components are added via the `npx shadcn@latest add` CLI — they are not npm dependencies but source files copied into `src/components/ui/`.

### 8.6 TypeScript Type System

**Core Types:**

```typescript
// src/lib/types.ts

type SupportedProvider =
  | "openai" | "anthropic" | "gemini" | "cohere"
  | "huggingface" | "mistral" | "groq" | "together"
  | "replicate" | "bedrock" | "perplexity" | "xai"
  | "fireworks" | "deepseek" | "unknown";

type ValidationStatus =
  | "idle" | "detecting" | "validating"
  | "valid" | "invalid" | "quota_exceeded"
  | "permission_error" | "provider_down"
  | "timeout" | "error";

type ValidationResult = {
  status: ValidationStatus;
  provider: SupportedProvider;
  keyMasked: string;
  validatedAt: string;          // ISO 8601
  models?: ModelInfo[];
  quota?: QuotaInfo;
  account?: AccountInfo;
  error?: ErrorInfo;
  rawResponse?: unknown;        // For debugging; stripped before localStorage
};

type ModelInfo = {
  id: string;
  name: string;
  available: boolean;
  capabilities?: string[];
};

type QuotaInfo = {
  tier?: string | number;
  rpm?: number;
  tpm?: number;
  usedPercent?: number;
  resetAt?: string;
};

type AccountInfo = {
  orgId?: string;
  userId?: string;
  emailMasked?: string;
  accountType?: string;
  hasBilling?: boolean;
};

type ErrorInfo = {
  code: string;
  httpStatus: number;
  humanMessage: string;
  providerMessage?: string;
};

type HistoryEntry = {
  id: string;
  timestamp: string;
  provider: SupportedProvider;
  keyMasked: string;
  status: ValidationStatus;
  summary: Partial<Pick<ValidationResult, "models" | "quota" | "account">>;
  isBatch: boolean;
  batchId?: string;
};
```

### 8.7 Validation Engine Design Pattern

Each provider validator implements the same interface:

```typescript
// src/lib/validators/index.ts

interface ProviderValidator {
  provider: SupportedProvider;
  validate(key: string, options?: ValidatorOptions): Promise<ValidationResult>;
  detect(key: string): DetectionResult;
}

type DetectionResult = {
  provider: SupportedProvider;
  confidence: "high" | "medium" | "low" | "none";
  ambiguous: boolean;
  alternativeProviders?: SupportedProvider[];
};

type ValidatorOptions = {
  // Provider-specific options
  region?: string;          // AWS Bedrock
  secretKey?: string;       // AWS Bedrock
  sessionToken?: string;    // AWS Bedrock
  timeout?: number;         // Default 10000ms
};
```

---

## 9. Security Considerations

### 9.1 Security Design Principles

TruthToken's security model is built on three pillars:

1. **Data Minimization:** Never collect what you don't need. Keys are used for validation and discarded.
2. **Client-Side Sovereignty:** The user's keys stay in the user's browser wherever technically possible.
3. **Transparency:** The security model is explained plainly in the UI, not buried in a privacy policy.

### 9.2 Key Handling Lifecycle

```
Key enters browser (paste/type)
    |
    v
Stored in React component state (RAM only)
    |
    v
If direct fetch: sent directly to provider — never touches TruthToken servers
If proxy needed: sent over HTTPS to /api/validate — forwarded immediately, not logged
    |
    v
Validation complete: key cleared from state on navigation
    |
    v
History stored: only masked representation persisted to localStorage
    |
    v
Export: full key included only if user explicitly opts in (with warning)
```

### 9.3 Server-Side Proxy Security Controls

| Control | Implementation |
|---|---|
| SSRF Prevention | Allowlist of valid provider URLs; reject any non-listed hostname |
| Input Validation | `provider` must be a `SupportedProvider` enum value |
| Rate Limiting | `@vercel/kv` or in-memory (per deployment) token bucket: 60 req/min/IP |
| Timeout | `AbortController` with 10-second deadline on all outbound requests |
| No Logging | `console.log` stripped in production; no APM payload capture of request bodies |
| HTTPS Only | `next.config.ts` enforces HTTPS redirects; HSTS header set |
| CSP Header | Content-Security-Policy restricts allowed origins for API calls |
| No Cookies | Proxy route explicitly strips `Cookie` headers from both request and response |

### 9.4 Frontend Security Controls

| Control | Implementation |
|---|---|
| No `localStorage` key storage | History stores only masked key; full key never written |
| Input sanitization | Keys are trimmed and validated against expected character sets before use |
| Key masking | Visual masking applied at all times in UI; full key only in memory |
| No analytics with key data | Analytics (if any) must not capture input field values |
| `referrer-policy: no-referrer` | Prevents key data leaking via Referer headers to provider servers |
| Clipboard access | Only triggered by explicit user action; no passive clipboard reading |
| No third-party scripts | No GTM, no third-party analytics scripts that could exfiltrate data |

### 9.5 Transparency Features

- **Security Notice Banner:** Displayed prominently below the input: "Your API keys are never stored on our servers. Direct fetch where possible; stateless proxy for CORS-restricted providers. Read our security model."
- **Open Source:** The codebase is fully open source on GitHub, allowing users to audit the proxy implementation
- **"How This Works" Page:** A dedicated `/security` route explains the validation flow with diagrams

### 9.6 Threat Model

| Threat | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Malicious proxy logging keys | Low (open source) | Critical | Open source code; no logging in proxy |
| XSS exfiltrating keys from DOM | Medium | Critical | Strict CSP; sanitized inputs; no `dangerouslySetInnerHTML` |
| SSRF via proxy endpoint parameter | Medium | High | Provider URL allowlist; strict input validation |
| localStorage key theft via XSS | Low (no full keys stored) | Low | Full keys never written to localStorage |
| MITM on provider API calls | Low (HTTPS) | High | HTTPS enforced; certificate pinning not feasible in browser |
| Rate limit abuse of proxy | Medium | Medium | IP-based rate limiting; abuse reporting |
| Accidental key inclusion in exports | Medium | High | Export defaults to masked; explicit opt-in with warning for full keys |

---

## 10. Success Metrics

### 10.1 Launch Criteria (v1.0 Release Gate)

All of the following must be true before v1.0 ships:

- [ ] All 10 P0 and P1 features implemented and manually tested
- [ ] Validation works correctly for all 14 listed providers
- [ ] Lighthouse score >= 90 on Performance, Accessibility, Best Practices, SEO
- [ ] PWA installability score: 100 (all PWA checklist items passing)
- [ ] Zero `localStorage` writes of unmasked keys (verified via automated test)
- [ ] Proxy SSRF allowlist tested with adversarial inputs
- [ ] WCAG 2.1 AA compliance verified via axe-core automated scan
- [ ] Mobile responsiveness tested on iPhone 14 (375px) and Galaxy S21 (360px)
- [ ] Dark/light mode tested with system preference detection
- [ ] All keyboard shortcuts verified in Chrome, Firefox, Safari

### 10.2 Engagement Metrics (30-day post-launch)

| Metric | Target |
|---|---|
| Unique visitors | 5,000 |
| Keys validated per day (average) | 500 |
| Batch validation sessions | > 15% of all sessions |
| PWA installs | > 5% of return visitors |
| Avg. time to first validation | < 30 seconds |
| Bounce rate | < 40% |
| Mobile traffic share | > 30% |

### 10.3 Quality Metrics

| Metric | Target |
|---|---|
| Validation accuracy (false positive rate) | < 0.1% |
| Validation accuracy (false negative rate) | < 0.5% |
| Avg. validation response time | < 3 seconds (p50), < 8 seconds (p95) |
| Proxy error rate (5xx) | < 0.5% |
| Core Web Vitals — LCP | < 2.5 seconds |
| Core Web Vitals — INP | < 200ms |
| Core Web Vitals — CLS | < 0.1 |

### 10.4 Security Metrics

| Metric | Target |
|---|---|
| Security incidents involving key exfiltration | 0 |
| SSRF attempts blocked by allowlist | Logged, target 100% block rate |
| Proxy rate limit trigger rate | < 1% of legitimate sessions |
| Dependency vulnerabilities (critical/high) | 0 open after 30 days |

### 10.5 User Satisfaction Metrics

- In-app feedback widget (thumbs up/down + optional text after each validation)
- Target: > 90% positive feedback on validation results
- Export feature satisfaction: > 85% of users who export rate it as "useful"
- Keyboard shortcut discoverability: > 20% of power users (>3 visits) use shortcuts

---

## Appendix A: Supported Providers Summary

| Provider | Key Format | Validation Strategy | CORS Direct | Metadata Richness |
|---|---|---|---|---|
| OpenAI | `sk-proj-...` | GET /v1/models | Yes | High |
| Anthropic | `sk-ant-...` | GET /v1/models | No (proxy) | High |
| Google Gemini | `AIza...` | GET /v1beta/models | Yes | Medium |
| Cohere | `[40 chars]` | GET /check-api-key | No (proxy) | Medium |
| Hugging Face | `hf_...` | GET /api/whoami-v2 | Yes | High |
| Mistral | UUID format | GET /v1/models | Yes | Medium |
| Groq | `gsk_...` | GET /openai/v1/models | Yes | High |
| Together AI | `[long str]` | GET /v1/models | Yes | Medium |
| Replicate | `r8_...` | GET /v1/account | Yes | High |
| AWS Bedrock | AKIA + secret | ListFoundationModels | No (proxy+SDK) | High |
| Perplexity | `pplx-...` | POST /chat (1 token) | No (proxy) | Low |
| xAI | `xai-...` | GET /v1/models | Yes | Medium |
| Fireworks AI | `fw_...` | GET /v1/models | Yes | Medium |
| DeepSeek | `sk-...` | GET /models | Yes | Medium |

## Appendix B: Browser Support Matrix

| Browser | Min Version | Notes |
|---|---|---|
| Chrome / Chromium | 120+ | Primary target |
| Firefox | 121+ | Full support |
| Safari | 17+ | PWA install via "Add to Home Screen" |
| Edge | 120+ | Chromium-based, same as Chrome |
| Samsung Internet | 24+ | Mobile primary |
| Mobile Safari | iOS 17+ | PWA installability limited vs. Android |

## Appendix C: Phased Rollout Plan

**Phase 1 (v1.0) — Core Validation:**
Provider support for top 8 (OpenAI, Anthropic, Gemini, Hugging Face, Groq, Mistral, Replicate, Cohere). Single key validation. Basic results display. Dark/light mode. Mobile responsive.

**Phase 2 (v1.1) — Power Features:**
Batch validation. Local history. Export (JSON/CSV). Keyboard shortcuts. Provider status integration. PWA support. Remaining 6 providers.

**Phase 3 (v1.2) — Polish & Community:**
Rate limit visualizer. Result sharing via URL. Key diff tool. Internationalization (i18n). Community-contributed provider validators.

---

### Critical Files for Implementation

Based on the architecture designed in this PRD, the most critical files to create first are:

- `/c/Users/Karan/Desktop/Projects/NextJs/Fun/tokentruth/src/lib/types.ts`
- `/c/Users/Karan/Desktop/Projects/NextJs/Fun/tokentruth/src/lib/validators/index.ts`
- `/c/Users/Karan/Desktop/Projects/NextJs/Fun/tokentruth/src/lib/detection/patterns.ts`
- `/c/Users/Karan/Desktop/Projects/NextJs/Fun/tokentruth/src/app/api/validate/route.ts`
- `/c/Users/Karan/Desktop/Projects/NextJs/Fun/tokentruth/src/hooks/useValidation.ts`