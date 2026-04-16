# AI Ad Creation Tool — CLAUDE.md
# Read this FULLY before writing any code.

## Project Overview
Tool: AI-powered ad generator
Goal: URL → scrape → AI copy → video ad → edit → download
Stack: Next.js (frontend) + FastAPI (backend) + Supabase (DB)
Deploy: Vercel (demo) → Oracle Cloud Infrastructure (production)

## Folder Structure
/frontend        → Next.js app (port 3000)
/backend         → FastAPI app (port 8000)
/backend/main.py → All API endpoints here

## Key API Endpoints
POST /api/scrape        → input: {url} → output: business JSON
POST /api/generate-ad   → input: business JSON → output: {video_url, headline, ad_copy, id}
GET  /api/ads           → list all saved ads
GET  /api/ads/{id}      → get single ad
PUT  /api/ads/{id}      → update ad (editor saves here)

## ⚠️ SECURITY — YOU MUST FOLLOW THESE
- NEVER hardcode API keys anywhere in code
- ALWAYS use environment variables via os.getenv()
- NEVER commit .env file — it is in .gitignore
- NEVER log API keys or tokens to console
- ALWAYS validate and sanitize URL input before scraping
- ALWAYS use HTTPS URLs only for scraping
- Rate limit: max 10 requests/minute per IP (already configured)
- Supabase: use anon key on frontend, service key on backend ONLY

## Environment Variables Required
CF_API_TOKEN              → Cloudflare Browser Rendering token
CF_ACCOUNT_ID             → Cloudflare account ID
OPENAI_API_KEY            → ad copy generation

SUPABASE_URL              → database
SUPABASE_KEY              → Supabase anon key (used by backend)

## Code Style Rules
- Python: use async/await in FastAPI, type hints always
- JavaScript: use ES modules (import/export), no require()
- Always destructure imports: import { useState } from 'react'
- No console.log in production code — use proper logging
- Handle all errors — never leave bare except: pass

## Commands to Run
# Backend
cd backend && pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Frontend
cd frontend && npm install
npm run dev

# Test backend
curl -X POST http://localhost:8000/api/scrape \
  -H "Content-Type: application/json" \
  -d '{"url": "https://stripe.com"}'

## What This Tool Does (2 features ONLY)
1. Generate ad from URL → /api/scrape → /api/generate-ad
2. Edit that ad → PUT /api/ads/{id} → frontend editor

## IMPORTANT RULES — DO NOT VIOLATE
- MVP only — do NOT add features not listed above
- Do NOT change the database schema without asking
- Do NOT switch API providers without asking
- When fixing bugs: fix only what is broken, nothing else
- Always test the endpoint after any backend change
- Always check .env.example is updated when adding new vars

## Oracle Cloud Deployment Notes
- Backend: OCI Compute Instance (Ubuntu 22.04)
- Frontend: Vercel (connected to GitHub)
- Storage: OCI Object Storage for video files (future)
- Use Nginx as reverse proxy for FastAPI
- SSL via Let's Encrypt (certbot)

## When Compacting Context — Preserve
- Current endpoint being worked on
- List of modified files
- Any pending bugs or TODOs
- Current test status
