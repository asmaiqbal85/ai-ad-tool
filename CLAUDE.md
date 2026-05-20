# RunAds.io — Pakistan's AI-Powered Self-Serve Ad Platform
# Read this FULLY before writing any code.

## Vision
RunAds.io is an AI-powered marketing platform 
designed to become the "AI marketing employee" 
for small and medium businesses. The platform 
allows businesses to paste their website URL, 
after which AI agents automatically understand 
the business, generate professional video ads, 
write marketing copy, create campaign strategies, 
and eventually launch and optimize ads across 
platforms like Facebook and Instagram.

The long-term vision is to build marketing 
infrastructure for SMBs — a system that 
continuously learns from business data, ad 
performance, customer behavior, and local 
market trends to automate business growth 
at scale.

The platform is being built in phases:
Phase 1: AI self-serve ad generation SaaS
Phase 2: AI agent-based marketing platform
Phase 3: Fully autonomous AI marketing employee

## Core AI Architecture Vision
RunAds.io is evolving from a simple automation 
pipeline into a multi-agent AI marketing system.

Planned specialized AI agents:
- Website Intelligence Agent
- Creative Strategy Agent
- Copywriting Agent
- Video Storyboard Agent
- Audience Targeting Agent
- Campaign Optimization Agent

These agents will work under a central 
orchestration layer using OpenAI Agents SDK.

## Current Status
- URL → AI video ad generation working ✅
- Ad editor with re-render ✅
- Professional landing page live ✅
- User authentication + tenant isolation ✅
- Founder onboarding + SQL backfill ✅
- Multi-template + voiceover (NEXT)
- Meta Ads API integration
- Payment system integration
- Agent orchestration architecture
- Queue and workflow infrastructure
- Business memory layer for AI learning

## Tagline
"Create. Target. Run. Repeat."

## Target Market
- Primary: Pakistani small-medium businesses
- Secondary: International businesses (future)
- Examples: Restaurants, clothing brands, 
  real estate, education, e-commerce

## Business Model
1. Free trial — 3 ads, no credit card needed
2. Subscription — Rs 5,000-40,000/month
3. Agency — managed service for big clients
4. White label — sell platform to others

---

## Project Structure
/frontend        → Next.js 14 app (port 3000)
/backend         → FastAPI app (port 8000)
/backend/app/main.py    → app entry point
/backend/app/api/       → all route files
/backend/app/services/  → business logic
/backend/app/schemas/   → pydantic models

## Current API Endpoints
POST /api/scrape              → {url} → business JSON
POST /api/generate-ad         → business JSON → {video_url, headline, ad_copy, id}
GET  /api/ads                 → list all ads (filtered by user_id when auth added)
GET  /api/ads/{id}            → get single ad
PUT  /api/ads/{id}            → update ad text fields
POST /api/ads/{id}/rerender   → re-render video with edited values
GET  /health                  → {"status":"ok"}

---

## What Is Already Built — DO NOT BREAK
Live URL: https://ai-ad-tool.vercel.app
A client named Jamal has access — NEVER break it.
Git repo: github.com/asmaiqbal85/ai-ad-tool

Working features:
- URL scraping via Cloudflare Browser Rendering
- AI copywriting via OpenAI GPT-4o-mini
- Creatomate video generation with polling
- Video re-render after edit
- Real blob download (not window.open)
- Supabase database with RLS (4 policies)
- Vercel frontend connected to OCI backend
- Permanent Cloudflare tunnel on OCI
- All 5 priority bugs fixed and tested
- Polished UI on all 4 pages

Dead code to delete when possible:
- backend/app/services/ai.py (unused)

---

## Tech Stack
Frontend: Next.js 14 + TypeScript + Tailwind CSS
Backend API: FastAPI
Database: Supabase (PostgreSQL + pgvector planned)
Authentication: Supabase Auth
AI Models: OpenAI GPT-4o-mini
AI Agent System: OpenAI Agents SDK (planned)
Video Generation: Creatomate API
Web Scraping: Cloudflare Browser Rendering
Queue/Workflow (planned): Redis + Temporal/DBOS
Hosting Frontend: Vercel
Hosting Backend: Oracle OCI Docker Container
Networking: Cloudflare Tunnel
Payments (planned): Stripe
Future Integrations: Meta Ads API

Backend infrastructure details:
- OCI VM: Ubuntu 22.04, public IP 129.80.37.199
- Docker container with --restart unless-stopped
- Cloudflare tunnel: permanent systemd service

Database details:
- Supabase project: sjprvzyyiuqvtwrobbfz.supabase.co
- RLS enabled (policies scoped by auth.uid())

Future APIs (do not add without asking):
- Meta Ads API (Facebook/Instagram)
- Google Ads API (YouTube)
- Stripe (international payments)
- JazzCash/EasyPaisa (Pakistan payments)
- OpenAI Agents SDK (AI optimization)
- OpenAI TTS (voiceover)

---

## Creatomate Template
Account: new account (50 fresh credits)
Template ID: ea8207ba-9e84-40ce-9d98-41f985ed4c66
Template: Content Promotion 16:9 Landscape
Element names — EXACT, do not change:
- Title        → headline
- Text-1       → ad_copy
- Text-2       → "" (empty string)
- Logo         → logo URL from scrape
- Background   → first image URL from scrape

---

## Environment Variables

Frontend (.env.local):
NEXT_PUBLIC_API_URL=https://for-foot-existed-super.trycloudflare.com

Backend (.env on OCI at ~/ai-ad-tool/backend/):
SUPABASE_URL=
SUPABASE_KEY=
OPENAI_API_KEY=
CF_ACCOUNT_ID=
CF_API_TOKEN=
CREATOMATE_API_KEY=
CREATOMATE_TEMPLATE_ID=ea8207ba-9e84-40ce-9d98-41f985ed4c66
ALLOWED_ORIGINS=https://ai-ad-tool.vercel.app

---

## Build Phases — In This Exact Order
Never skip phases. Never build phase 2 before phase 1 is done.

### PHASE 1 — Foundation (Current Sprint)

Step 1: Rebrand (1 day)
- Change all "AI Ad Tool" to "RunAds.io"
- Update page titles, nav, footer, meta tags
- Keep all functionality exactly the same
- Commit: "rebrand: AI Ad Tool to RunAds.io"

Step 2: User Authentication (3-4 days)
- Supabase Auth (email + password)
- /auth/signup page
- /auth/login page
- Protected routes (redirect if not logged in)
- Add user_id column to ads table
- Each user sees only their own ads
- Update all API endpoints to filter by user_id
- Logout button in navbar
- Commit: "feat: add user authentication"

Step 3: Better Videos + Voiceover (4-5 days)
- 3 Creatomate template options for user to pick
- Template picker UI shown before generation
- OpenAI TTS for AI voiceover from ad copy
- 3 voice options: male, female, energetic
- Audio player in editor page
- Commit: "feat: multiple templates and voiceover"

Step 4: Payments (3-4 days)
- Stripe for international customers
- Free tier: 3 ads/month no credit card
- Pro tier: unlimited ads + ad distribution
- Payment wall after free tier used
- Commit: "feat: stripe payments and subscriptions"

### PHASE 2 — Ad Distribution

Step 5: Meta Ads API (2-3 weeks)
- User connects their Facebook page
- Create ad campaigns via Meta API
- Location targeting (city level Pakistan)
- Audience targeting (age, gender, interests)
- Daily budget management
- Campaign status and pause/resume

Step 6: Campaign Dashboard (1 week)
- Impressions, clicks, spend shown
- Simple graphs anyone understands
- Campaign performance alerts
- Money spent vs remaining budget

### PHASE 3 — Scale

Step 7: YouTube Ads API
Step 8: JazzCash and EasyPaisa payments
Step 9: OpenAI Agents SDK
  - AI agent to auto-optimize campaigns
  - Suggest better ad copy
  - Predict best audiences
  - Auto-adjust budgets based on performance
Step 10: TV Streaming (CTV) for international
Step 11: Arabic and Gulf market expansion
Step 12: White label system for resellers

---

## Deployment Process

### Frontend (Vercel — automatic)
git add .
git commit -m "your message"
git push
Vercel auto deploys in ~35 seconds.
Check: https://ai-ad-tool.vercel.app

### Backend (OCI — manual steps)
Step 1: SSH into OCI:
ssh -i "D:\projects\ads\ssh-keys\ssh-key-2026-04-07.key" ubuntu@129.80.37.199

Step 2: Pull latest code:
cd ~/ai-ad-tool
git pull

Step 3: Rebuild and restart Docker:
cd backend
docker stop ai-ad-tool
docker rm ai-ad-tool
docker build -t ai-ad-tool-backend .
docker run -d --name ai-ad-tool \
  --restart unless-stopped \
  --env-file .env \
  -p 8000:8000 \
  ai-ad-tool-backend

Step 4: Verify running:
docker ps
curl http://localhost:8000/health

Step 5: Check tunnel:
sudo systemctl status cloudflared

---

## Security Rules — NEVER VIOLATE
- NEVER hardcode API keys anywhere in code
- ALWAYS use environment variables via os.getenv()
- NEVER commit .env file — it is in .gitignore
- NEVER log API keys or tokens to console
- ALWAYS validate and sanitize URL input
- ALWAYS use HTTPS URLs only for scraping
- Rate limit: max 10 requests/minute per IP
- Supabase: anon key frontend only
         service key backend only NEVER frontend

---

## Code Style Rules
Python:
- Use async/await in all FastAPI routes
- Type hints always on all functions
- Never leave bare except: pass
- Handle all errors with HTTPException

JavaScript/TypeScript:
- ES modules only (import/export)
- Never use require()
- Always destructure imports
- No console.log in production code
- Always handle promise rejections

---

## Golden Rules For Claude Code
1. NEVER break the live app at any time
2. NEVER touch working backend services
3. ALWAYS show plan before writing any code
4. ALWAYS do one step at a time
5. ALWAYS commit to git after each step
6. ALWAYS tell user exactly what to test
7. NEVER install new packages without asking
8. NEVER change environment variable names
9. NEVER rewrite working code — only add
10. ALWAYS handle errors with friendly messages
11. NEVER change database schema without asking
12. NEVER switch API providers without asking

---

## Known Issues To Fix Later
- Cloudflare tunnel URL changes on server restart
  → needs permanent named tunnel with real domain
- Supabase pauses after 7 days of inactivity
  → upgrade to Pro after first paying customers
- Creatomate free trial only 50 renders
  → upgrade when revenue starts coming in
- backend/app/services/ai.py is dead code
  → delete on next cleanup pass

---

## When Compacting Context — Always Preserve
- Current phase and step being worked on
- List of files modified in this session
- Any pending bugs or TODOs
- Current test status (what passed, what failed)
- Last commit message