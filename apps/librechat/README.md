# LibreChat customisation directory

This folder is mounted into the `librechat` container and overrides LibreChat's
default configuration. We use LibreChat as a **backend API server only** —
the [Next.js app](../../apps/web) is the UI.

## Files

| File | Purpose |
|------|---------|
| `librechat.yaml` | Model routing, file handling, rate limits. Mounted at `/app/librechat.yaml` (via `CONFIG_PATH`). |

## Why YAML overrides instead of a fork

PRD Phase 1 explicitly states "LibreChat 커스터마이징". A config-only approach:

- **Keeps the upgrade path clean** — pull the latest `ghcr.io/danny-avila/librechat` image without merge conflicts.
- **Avoids UI duplication** — ssamAI's UI lives entirely in Next.js; LibreChat's client is not user-facing.
- **Routes all LLM traffic through LiteLLM** — a single OpenAI-compatible base URL with DeepSeek + MiniMax behind it.

## Endpoints exposed to the Next.js app

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/register` | Email signup |
| POST | `/api/login` | JWT issuance |
| GET  | `/api/convos?teacherId=...` | List recent conversations |
| POST | `/api/messages` | Send message (SSE stream back) |
| GET  | `/api/models` | List available LiteLLM models |

## Verifying locally

```bash
docker compose up -d librechat litellm mongo
curl http://localhost:3090/health  # LibreChat liveness
curl -H "Authorization: Bearer $LITELLM_MASTER_KEY" http://localhost:4000/v1/models
```

## Phase 2+ items (out of scope here)

- Kakao/Google OAuth integration via LibreChat's `socialLogins` field
- S3 / NCloud Object Storage for `fileStrategy`
- Custom MCP plugins for NEIS / 에듀넷 integration
