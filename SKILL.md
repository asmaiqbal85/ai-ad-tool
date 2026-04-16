# SKILL.md — AI Ad Creation Tool

A reference for building similar URL → AI → video ad pipelines faster.
Captures architecture, integrations, bugs, deploy steps, and reusable patterns
distilled from this project.

---

## 1. PROJECT OVERVIEW

### What this app does
Pipeline: **URL → scrape brand assets → AI ad copy → render video → edit → download**.

User flow:
1. User pastes any product URL on `/ads/new`.
2. Backend scrapes the page (Cloudflare Browser Rendering) and extracts business name,
   tagline, logo, brand colors, hero images.
3. OpenAI generates a punchy headline + ad body.
4. Creatomate composites these into an MP4 video using a fixed template.
5. Ad row is saved to Supabase; user is redirected to `/ads/{id}/edit`.
6. User can tweak headline/copy/colors → click *Save & Re-render* → updated MP4 returned.
7. *Download Video* button saves the MP4 to disk via blob fetch.

### Tech stack
| Layer       | Choice                          | Why                                           |
|-------------|---------------------------------|-----------------------------------------------|
| Frontend    | Next.js 14 (App Router) + Tailwind | Vercel-native; SSR for ad gallery        |
| Backend     | FastAPI + Python 3.11           | Async-first; clean Pydantic schemas           |
| Database    | Supabase (Postgres)             | Free tier, REST client, hosted                |
| Scraping    | Cloudflare Browser Rendering    | Real headless Chromium, no infra              |
| Copywriting | OpenAI `gpt-4o-mini`            | Cheap, JSON mode, fast                        |
| Video       | Creatomate                      | Template-based MP4 rendering via REST         |
| Hosting FE  | Vercel                          | Auto-deploy on push                           |
| Hosting BE  | Oracle Cloud (Always Free VM)   | Free tier; Docker-friendly                    |

---

## 2. ARCHITECTURE

```
Browser ──► Vercel (Next.js) ──► OCI VM (FastAPI)
                                    │
                                    ├──► Cloudflare Browser Rendering (scrape)
                                    ├──► OpenAI (copywriting)
                                    ├──► Creatomate (video render + poll)
                                    └──► Supabase Postgres (persistence)
```

### Frontend → Backend
- All API calls go through `frontend/src/lib/api.ts`.
- Base URL comes from `process.env.NEXT_PUBLIC_API_URL`. The lib **throws at import time**
  if the env var is missing — fail-fast catches Vercel misconfig immediately.
- Calls are plain `fetch` with JSON bodies. No axios, no SDK.

### Backend → Supabase
- `backend/app/services/supabase.py` calls `create_client(SUPABASE_URL, SUPABASE_KEY)` per request.
- Backend uses the **service-role key** (bypasses RLS). Never expose it to the browser.
- Frontend uses the anon key directly only if you need browser-side reads (currently it doesn't —
  all reads/writes go through FastAPI).

### Cloudflare Browser Rendering vs Cloudflare Tunnel — they're different things
| Service                       | Purpose in this project                                                  |
|-------------------------------|--------------------------------------------------------------------------|
| **Browser Rendering API**     | Server-side scraping — backend POSTs URL, gets fully-rendered HTML back. |
| **Cloudflare Tunnel** (cloudflared) | Optional deployment piece — exposes the OCI backend on a public HTTPS hostname **without opening any inbound ports** on the VM. |

Tunnel flow: `cloudflared` runs on the VM, makes an outbound persistent connection to
Cloudflare's edge, and Cloudflare routes `https://api.yourdomain.com` traffic back through it
to `localhost:8000`. Free TLS, no nginx, no firewall holes.

---

## 3. API INTEGRATIONS

### Cloudflare Browser Rendering
- Endpoint: `POST https://api.cloudflare.com/client/v4/accounts/{account_id}/browser-rendering/content`
- Auth: `Authorization: Bearer <CF_API_TOKEN>` (token needs Browser Rendering — Edit permission).
- Body:
  ```json
  {
    "url": "https://stripe.com",
    "rejectResourceTypes": ["image"],
    "setExtraHTTPHeaders": {"Accept-Language": "en-US,en;q=0.9"}
  }
  ```
- Returns `{ "result": "<full html>", "success": true }`. Always `data["result"]`, not `resp.text`.
- Code: `backend/app/services/browser.py`.

**Extraction strategy** (`extract_business_data`):
- Business name: `<meta property="og:site_name">` → `<title>` (split on `|-–—:`).
- Tagline: `og:description` → `<meta name="description">`.
- Logo: `<img>` with `class/id/alt` matching `/logo/i` → `apple-touch-icon` → favicon.
- Colors: `theme-color` meta + `msapplication-TileColor` + hex regex over `<style>` tags. Strip `#fff/#000` defaults.
- Images: `og:image` first, then `<img src>` (filter 1×1 tracking pixels by `width/height`).

### OpenAI GPT-4o-mini
- SDK: `openai` (async) — `AsyncOpenAI(api_key=...)`.
- Use `response_format={"type": "json_object"}` and ask the prompt to return exact JSON keys.
  Removes JSON-parsing fragility entirely.
- Model: `gpt-4o-mini` — adequate for short ad copy, ~$0.001 per call.
- Code: `backend/app/services/copywriter.py`.
- **Note:** there's a stale `backend/app/services/ai.py` from an earlier iteration that uses
  different keys (`title`/`description`/`body_text`/`cta`). It's unused — copywriter.py is the
  active path. Delete it next cleanup.

### Creatomate
- Endpoint: `POST https://api.creatomate.com/v1/renders`
- Body:
  ```json
  {
    "template_id": "<uuid>",
    "modifications": { "Title": "...", "Text-1": "...", "Logo": "url", "Background": "url" }
  }
  ```
- Returns a **list** of renders: `result[0]["id"]` and an initial `url` that **does not exist yet**.
- You MUST poll `GET /v1/renders/{id}` until `status == "succeeded"` before returning the URL.
  Otherwise the frontend gets a 404 on the video.

#### Element names for the template
Must match the layer names in your Creatomate template **exactly** (case-sensitive, dash-sensitive):

| Element       | What goes in it                                  |
|---------------|--------------------------------------------------|
| `Title`       | Headline (from OpenAI)                           |
| `Text-1`      | Ad copy / body                                   |
| `Text-2`      | Reserved (currently empty)                       |
| `Logo`        | Logo URL (must be HTTPS)                         |
| `Background`  | Hero/background image URL (HTTPS)                |

Default template ID used: `5b1a4554-c334-4c23-bd03-26c7b5971543` (override via `CREATOMATE_TEMPLATE_ID`).

### Supabase
- Single table `ads` (see `supabase-schema.sql`):
  ```sql
  create table ads (
    id uuid default gen_random_uuid() primary key,
    url text,
    headline text,
    ad_copy text,
    video_url text,
    colors jsonb default '[]'::jsonb,
    logo text default '',
    images jsonb default '[]'::jsonb,
    created_at timestamptz default now()
  );
  ```
- For DBs created before the visuals work: use the commented `alter table ... add column if not exists`
  block in `supabase-schema.sql` — idempotent, safe to re-run.
- Backend uses service-role key → RLS is effectively bypassed.

---

## 4. COMMON BUGS AND FIXES

### Creatomate render polling
**Symptom:** initial response gives a `url` that 404s.
**Fix:** poll `GET /renders/{id}` every 3s up to 60s; only return the URL once
`status == "succeeded"`. Treat `failed` as a hard error. See `creatomate.py:69-87`.

### Duplicate save on generate
**Symptom:** every generated ad created two rows.
**Fix:** `/api/generate-ad` is the **only** writer for new ads — the frontend
must not also POST to `/api/ads`. Check `frontend/src/lib/api.ts`: `generateAd()` is
called once from `/ads/new`; `createAd()` exists but is unused in the happy path.

### Video re-render after edit
**Symptom:** Save updated DB text but preview still showed the old MP4.
**Fix (backend):** added `POST /api/ads/{id}/rerender` (`backend/app/api/ads.py:55-96`)
which calls Creatomate again, polls, then writes the new `video_url` to the row.
**Fix (frontend):** the `<video>` element uses `key={ad.video_url}` so React unmounts
and remounts when the URL changes — without that, the browser keeps the old buffered video.

### Download button (open vs save)
**Symptom:** clicking *Download* opened the MP4 in a new tab instead of saving it.
**Fix:** `<a download>` is ignored cross-origin. Use the **blob pattern**:
```js
const res = await fetch(videoUrl);
const blob = await res.blob();
const objectUrl = URL.createObjectURL(blob);
const a = document.createElement("a");
a.href = objectUrl; a.download = "ad.mp4";
document.body.appendChild(a); a.click(); a.remove();
URL.revokeObjectURL(objectUrl);
```
Implemented in both editor pages.

### CORS
**Symptom:** browser console "blocked by CORS policy".
**Fix:** in `backend/app/main.py`, read `ALLOWED_ORIGINS` from env (comma-separated) and
pass to `CORSMiddleware`. Default to `http://localhost:3000` for dev. Set the prod value
in OCI's `.env` to your Vercel URL (e.g. `https://ai-ad-tool.vercel.app`).

### Mixed content (HTTPS frontend → HTTP backend)
**Symptom:** Vercel is HTTPS; calls to `http://<oci-ip>:8000` get blocked silently by the browser.
**Fix:** put HTTPS in front of the backend. Two options:
1. **Caddy** on the VM (auto Let's Encrypt) — requires DNS + open 80/443.
2. **Cloudflare Tunnel** (`cloudflared`) — no open ports, free TLS at `api.yourdomain.com`.
Either way, set `NEXT_PUBLIC_API_URL=https://api.yourdomain.com` in Vercel and redeploy.

### Supabase RLS
**Symptom:** rows aren't visible to the frontend, or inserts silently fail.
**Fix patterns:**
- Backend uses **service-role key** → bypasses RLS. This project does this.
- If you ever read directly from the browser with the anon key, add explicit policies, e.g.:
  ```sql
  alter table ads enable row level security;
  create policy "ads readable" on ads for select using (true);
  create policy "ads insertable via service" on ads for insert with check (true);
  ```
  Keep writes server-side; reads can be public (no PII in this table).

### Port 3000 conflict
**Symptom:** `next dev` fails with `EADDRINUSE` or silently picks 3001.
**Fix:** kill the lingering Node process. On Windows: `netstat -ano | findstr :3000` → `taskkill /PID <pid> /F`.
On Mac/Linux: `lsof -ti:3000 | xargs kill -9`. Or run on a different port: `next dev -p 3001` and
update `NEXT_PUBLIC_API_URL`/CORS accordingly.

### Bonus: Supabase project paused
**Symptom:** backend returns `Failed to save ad: [Errno 11002] getaddrinfo failed`.
**Cause:** Supabase free-tier projects pause after ~1 week of inactivity; the project subdomain
is removed from DNS. **Fix:** Dashboard → Restore project → wait 1–2 min for DNS.

---

## 5. DEPLOYMENT STEPS

Full walkthrough lives in `DEPLOY.md`. High-level:

### Backend → Oracle Cloud Always Free
1. Create VM: Ubuntu 22.04, `VM.Standard.E2.1.Micro`, public IP, upload SSH key.
2. Open port 8000 in **VCN Security List** AND in OS firewall (`iptables` / `firewalld`).
3. Install Docker (`apt install docker.io`), add user to `docker` group, log out/in.
4. `git clone` the repo, `cd backend`, write `.env` with all secrets.
5. `docker build -t ai-ad-tool-backend .` then `docker run -d --restart unless-stopped --env-file .env -p 8000:8000 ai-ad-tool-backend`.
6. `curl http://<vm-ip>:8000/health` → `{"status":"ok"}`.

### Cloudflare Tunnel as a service
```bash
# Install
curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg | sudo tee /usr/share/keyrings/cloudflare.gpg
echo "deb [signed-by=/usr/share/keyrings/cloudflare.gpg] https://pkg.cloudflare.com/cloudflared any main" | sudo tee /etc/apt/sources.list.d/cloudflared.list
sudo apt-get update && sudo apt-get install -y cloudflared

# Auth + create tunnel
cloudflared tunnel login                          # opens browser for CF auth
cloudflared tunnel create ai-ad-tool              # writes credentials JSON to ~/.cloudflared/
cloudflared tunnel route dns ai-ad-tool api.yourdomain.com

# Run as a systemd service (survives reboots)
sudo cloudflared service install
sudo systemctl enable --now cloudflared
sudo systemctl status cloudflared
```
Config file at `/etc/cloudflared/config.yml`:
```yaml
tunnel: <tunnel-id>
credentials-file: /root/.cloudflared/<tunnel-id>.json
ingress:
  - hostname: api.yourdomain.com
    service: http://localhost:8000
  - service: http_status:404
```

### Connect Vercel → OCI backend
1. In Vercel: Project → Settings → Environment Variables → set `NEXT_PUBLIC_API_URL` to
   either `http://<vm-ip>:8000` (dev) or `https://api.yourdomain.com` (prod via tunnel).
2. Push to `main` to trigger redeploy, or click *Redeploy* in Vercel UI.
3. Add the same Vercel URL to OCI backend's `ALLOWED_ORIGINS` env, then `docker restart ai-ad-tool`.

### Environment variables (full list)
**Backend (`backend/.env`)**
```
SUPABASE_URL=
SUPABASE_KEY=                   # service role key — backend only
OPENAI_API_KEY=
CF_ACCOUNT_ID=
CF_API_TOKEN=                   # Browser Rendering: Edit permission
CREATOMATE_API_KEY=
CREATOMATE_TEMPLATE_ID=5b1a4554-c334-4c23-bd03-26c7b5971543
ALLOWED_ORIGINS=https://ai-ad-tool.vercel.app
```

**Frontend (Vercel env)**
```
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

---

## 6. LESSONS LEARNED

### What worked well
- **JSON-mode OpenAI calls.** No regex, no try/except parsing — `response_format={"type":"json_object"}` makes the response trivially safe to `json.loads`.
- **Treating Creatomate as async.** Building the polling loop into the service from day one
  prevented a class of "video URL 404s" bugs.
- **One writer per resource.** Only `/api/generate-ad` creates ads; only `/rerender` updates the
  video URL. No frontend write-throughs. Keeps DB state predictable.
- **Fail-fast env validation.** `api.ts` throws if `NEXT_PUBLIC_API_URL` is missing —
  catches Vercel misconfig before the user clicks anything.
- **`key={ad.video_url}` on `<video>`.** Cheap React idiom that side-stepped a frustrating cache bug.

### Do differently next time
- **Use a shared types package** between FastAPI and Next.js. Pydantic schemas and TS interfaces
  drift. A small generator (`datamodel-code-generator` or OpenAPI → TS) is worth the setup.
- **Add a Cloudflare Tunnel from day one.** Skipping HTTP→HTTPS lets you wire up the prod URL
  immediately and avoids the mixed-content fire drill.
- **Persist `images`/`logo`/`colors` from the start.** Adding them later required a migration
  (the commented block in `supabase-schema.sql`). Cheaper to put them in the original schema.
- **Wire health checks earlier.** `GET /health` plus a periodic ping from the frontend would
  have caught the Supabase pause incident automatically.
- **Delete unused service files immediately.** `services/ai.py` is dead code that confused
  context-checks twice — `copywriter.py` is the live path.

### Time estimates per feature (next time)
| Feature                                | Estimate |
|----------------------------------------|----------|
| Scaffold FastAPI + Next.js + Supabase  | 0.5 day  |
| Cloudflare Browser Rendering scraper   | 0.5 day  |
| OpenAI copy generation                 | 0.25 day |
| Creatomate render + polling            | 1 day    |
| Editor page + re-render flow           | 0.5 day  |
| Real download (blob pattern)           | 0.25 day |
| OCI deploy + Cloudflare Tunnel + HTTPS | 1 day    |
| UI polish (gradient, stepper, gallery) | 0.5 day  |
| **Total**                              | **~4.5 days** |

---

## 7. REUSABLE CODE PATTERNS

### Pattern: Async polling for an external job
Use whenever an external API returns a job ID and you need a final URL/result.

```python
import asyncio
import httpx

POLL_INTERVAL = 3
POLL_TIMEOUT = 60

async def wait_for_render(client: httpx.AsyncClient, status_url: str, headers: dict) -> str:
    for _ in range(POLL_TIMEOUT // POLL_INTERVAL):
        await asyncio.sleep(POLL_INTERVAL)
        resp = await client.get(status_url, headers=headers)
        resp.raise_for_status()
        data = resp.json()
        status = data.get("status")
        if status == "succeeded":
            return data["url"]
        if status == "failed":
            raise RuntimeError(f"Render failed: {status_url}")
    raise TimeoutError(f"Render timed out after {POLL_TIMEOUT}s: {status_url}")
```

### Pattern: True "save to disk" download in the browser
For cross-origin files where `<a download>` is ignored.

```ts
async function downloadFile(url: string, filename: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(objectUrl);
}
```

### Pattern: Layered FastAPI error handling
Each external call wrapped, mapped to 502 with a meaningful detail string.

```python
@router.post("", response_model=GenerateAdResponse)
async def generate_ad(payload: GenerateAdRequest):
    try:
        copy = await generate_ad_copy(payload.model_dump())
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI generation failed: {e}")

    try:
        video_url = await create_video_ad(...)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Video rendering failed: {e}")

    try:
        saved = db.table("ads").insert({...}).execute().data[0]
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to save ad: {e}")

    return saved
```
The frontend gets a clean `{detail: "<which step> failed: <reason>"}` it can show or log —
critical for debugging multi-step pipelines without server access.

### Pattern: Force `<video>` to reload when src changes (React)
```tsx
<video key={ad.video_url} src={ad.video_url} controls autoPlay muted />
```
React unmounts/remounts the element, the browser drops the old buffer.

### Pattern: Fail-fast env in the browser bundle
```ts
const API_URL = process.env.NEXT_PUBLIC_API_URL;
if (!API_URL) {
  throw new Error("NEXT_PUBLIC_API_URL is not set. Add it to .env.local or Vercel env vars.");
}
```
Throws at module import time → first page render fails loudly instead of every fetch
silently 404-ing against `undefined/api/...`.
