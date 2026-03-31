# Deployment Guide

## 1. Frontend — Vercel

### Setup
1. Push your repo to GitHub
2. Go to https://vercel.com/new and import the repo
3. Set **Root Directory** to `frontend`
4. Vercel auto-detects Next.js — no build config changes needed

### Environment Variables (Vercel Dashboard → Settings → Environment Variables)
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_URL=https://your-backend-ip-or-domain:8000
```

### Deploy
Vercel deploys automatically on every push to `main`.

### Custom domain (optional)
Vercel Dashboard → Settings → Domains → Add your domain.

---

## 2. Backend — Oracle Cloud (Always Free Tier)

### A. Create a VM instance

1. Sign up at https://cloud.oracle.com (Always Free tier gives 2 AMD VMs)
2. Go to **Compute → Instances → Create Instance**
3. Settings:
   - **Image**: Ubuntu 22.04 (or Oracle Linux 8)
   - **Shape**: VM.Standard.E2.1.Micro (Always Free)
   - **Boot volume**: 50 GB (free tier max)
   - **Networking**: assign a public IP
   - **SSH key**: upload your public key (~/.ssh/id_rsa.pub)
4. Click **Create** and wait for RUNNING status

### B. Open port 8000

1. Go to **Networking → Virtual Cloud Networks**
2. Click your VCN → **Security Lists** → **Default Security List**
3. **Add Ingress Rule**:
   - Source CIDR: `0.0.0.0/0`
   - Destination Port Range: `8000`
   - Protocol: TCP
4. SSH into the VM and also open the OS firewall:
   ```bash
   # Ubuntu
   sudo iptables -I INPUT -p tcp --dport 8000 -j ACCEPT
   sudo netfilter-persistent save

   # Oracle Linux
   sudo firewall-cmd --permanent --add-port=8000/tcp
   sudo firewall-cmd --reload
   ```

### C. Install Docker

```bash
ssh -i ~/.ssh/id_rsa ubuntu@<your-vm-public-ip>

# Install Docker
sudo apt-get update
sudo apt-get install -y docker.io docker-compose-plugin
sudo systemctl enable docker
sudo usermod -aG docker $USER
# Log out and back in for group change
exit
ssh -i ~/.ssh/id_rsa ubuntu@<your-vm-public-ip>
```

### D. Deploy the backend

```bash
# Clone your repo
git clone https://github.com/your-user/ai-ad-tool.git
cd ai-ad-tool/backend

# Create .env file with your secrets
cat > .env << 'EOF'
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key
OPENAI_API_KEY=sk-your-key
CF_ACCOUNT_ID=your-cloudflare-account-id
CF_API_TOKEN=your-cloudflare-api-token
CREATOMATE_API_KEY=your-creatomate-api-key
CREATOMATE_TEMPLATE_ID=your-template-id
EOF

# Build and run
docker build -t ai-ad-tool-backend .
docker run -d \
  --name ai-ad-tool \
  --restart unless-stopped \
  --env-file .env \
  -p 8000:8000 \
  ai-ad-tool-backend
```

### E. Verify

```bash
curl http://<your-vm-public-ip>:8000/health
# Should return: {"status":"ok"}
```

### F. Update the frontend

Go to Vercel Dashboard → Environment Variables and set:
```
NEXT_PUBLIC_API_URL=http://<your-vm-public-ip>:8000
```

Redeploy (or push a commit to trigger auto-deploy).

---

## 3. HTTPS (recommended for production)

### Option A: Caddy reverse proxy on Oracle VM

```bash
sudo apt-get install -y caddy

# Edit Caddyfile
sudo tee /etc/caddy/Caddyfile << 'EOF'
api.yourdomain.com {
    reverse_proxy localhost:8000
}
EOF

sudo systemctl restart caddy
```

Point `api.yourdomain.com` DNS A record to your Oracle VM IP.
Caddy auto-provisions Let's Encrypt certificates.

Then update Vercel env var:
```
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

### Option B: Cloudflare Tunnel (no open ports needed)

```bash
# Install cloudflared
curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg | sudo tee /usr/share/keyrings/cloudflare.gpg
echo "deb [signed-by=/usr/share/keyrings/cloudflare.gpg] https://pkg.cloudflare.com/cloudflared any main" | sudo tee /etc/apt/sources.list.d/cloudflared.list
sudo apt-get update && sudo apt-get install -y cloudflared

# Authenticate and create tunnel
cloudflared tunnel login
cloudflared tunnel create ai-ad-tool
cloudflared tunnel route dns ai-ad-tool api.yourdomain.com
cloudflared tunnel --url http://localhost:8000 run ai-ad-tool
```

---

## Quick Reference

| Component | Where          | URL                                    |
|-----------|----------------|----------------------------------------|
| Frontend  | Vercel         | https://your-app.vercel.app            |
| Backend   | Oracle Cloud   | http://<vm-ip>:8000                    |
| Database  | Supabase       | https://your-project.supabase.co       |
