# Push WDS to GitHub - Step by Step

**Status:** Local git repo initialized and committed (103 files, commit 3628383)
**Next:** Create GitHub repo and push

---

## Option 1: Create New Repo via GitHub Website (Recommended - 2 mins)

### Step 1: Create Repo on GitHub

1. Go to https://github.com/new
2. **Repository name:** `wds-williams-delivery` or `WDS` or `williams-delivery-service`
3. **Description:** `WDS - Williams Delivery Service - Accra's fastest delivery platform. Next.js + Supabase + Expo + Paystack Ghana. Full stack production ready with 24 riders, MoMo payments, live tracking.`
4. **Visibility:** Choose Private (recommended for business) or Public
5. **DO NOT** initialize with README, .gitignore, or license - we already have them
6. Click **Create repository**

### Step 2: Push Local Code to GitHub

GitHub will show you commands after creating repo. Use these (replace YOUR_USERNAME and REPO_NAME):

```bash
cd /home/user/wds-fullstack

# Add remote (replace with your actual GitHub URL)
git remote add origin https://github.com/YOUR_USERNAME/wds-williams-delivery.git

# Rename branch to main (GitHub default now)
git branch -M main

# Push to GitHub
git push -u origin main
```

**If you use SSH (if you have SSH key):**

```bash
git remote add origin git@github.com:YOUR_USERNAME/wds-williams-delivery.git
git branch -M main
git push -u origin main
```

### Step 3: Verify on GitHub

Go to https://github.com/YOUR_USERNAME/wds-williams-delivery

You should see:
- 103 files
- README.md with WDS overview
- web/ folder with Next.js production app
- mobile/ folder with Expo rider app
- supabase/ folder with migrations and Edge Functions
- All 9 security audits: BUNDLE_OPTIMIZATION.md, SEO_AUDIT.md, AEO_AUDIT.md, SECURITY.md, SECURITY_ENDPOINTS_AUDIT.md, IDOR_AUDIT.md, ENV_SECURITY_AUDIT.md, RLS_AUDIT.md
- Pitch deck in pitch-deck/index.html
- Store assets in store-assets/

---

## Option 2: Using GitHub CLI (If Installed)

```bash
# Install gh CLI if not installed: https://cli.github.com/

# Login
gh auth login

# Create repo and push in one command (from wds-fullstack folder)
cd /home/user/wds-fullstack
gh repo create wds-williams-delivery --private --source=. --remote=origin --push --description="WDS Williams Delivery Service - Accra's fastest delivery platform - Next.js + Supabase + Expo + Paystack Ghana"

# Or public:
gh repo create wds-williams-delivery --public --source=. --remote=origin --push
```

---

## Option 3: Push to Existing Repo

If you already have a repo like https://github.com/username/wds:

```bash
cd /home/user/wds-fullstack
git remote add origin https://github.com/username/wds.git
git branch -M main
git push -u origin main --force
# --force only if existing repo is empty, otherwise it will merge
```

---

## After Push - Secure Setup Checklist

### 1. Add Environment Variables to GitHub Secrets (For CI/CD)

Go to Repo → Settings → Secrets and variables → Actions → New repository secret:

```
NEXT_PUBLIC_SUPABASE_URL = https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJ...
SUPABASE_SERVICE_ROLE_KEY = eyJ... (Mark as sensitive!)
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY = pk_test_xxx
PAYSTACK_SECRET_KEY = sk_test_xxx (Sensitive!)
INTERNAL_API_SECRET = your-random-32-char-secret (Sensitive!)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = AIza... (Restrict to wds.com.gh)
NEXT_PUBLIC_MAP_PROVIDER = leaflet
```

### 2. Enable GitHub Secret Scanning

Repo → Settings → Code security and analysis → Enable:
- Secret scanning
- Push protection (blocks commits with secrets)

This will catch if someone accidentally commits .env with real keys.

### 3. Add Branch Protection

Repo → Settings → Branches → Add rule for main:
- Require pull request reviews
- Require status checks
- Do not allow bypass

### 4. Deploy to Vercel from GitHub

1. Go to vercel.com → New Project → Import from GitHub → Select wds-williams-delivery
2. Root Directory: `web`
3. Add same env vars as above in Vercel Environment Variables panel
4. Mark secrets as Sensitive in Vercel (write-only)
5. Deploy → Get URL wds-williams-delivery.vercel.app → Add custom domain wds.com.gh

### 5. Share with Williams Team

Add Williams as collaborator: Repo → Settings → Collaborators → Add people → williams@...

---

## Current Local Commit

```
Commit: 3628383 feat: WDS Williams Delivery Service - Full Stack Production Ready
Files: 103 files, 17494 insertions
Branch: master (will rename to main on push)
Remote: Not yet added - you need to add origin via commands above
```

**What's Committed:**
- ✅ All source code (web, mobile, supabase)
- ✅ All docs (PRD, Architecture, 9 audits, deployment, pitch deck)
- ✅ .gitignore with .env, node_modules, .next, *.pem, *.key
- ✅ .cursorignore with .env for AI agents
- ✅ .env.example with dummy values (no real secrets)
- ❌ NOT committed: .env, .env.local, node_modules, .next, real secrets (correctly ignored)

**Verify no secrets in commit:**

```bash
cd /home/user/wds-fullstack
git show --stat
# Should NOT show .env or .env.local
grep -r "sk_live\|sk_test" --include="*.ts" web/ | grep -v "xxxxxxxx" | grep -v "node_modules" | grep -v ".next"
# Should be empty or only placeholder xxx
```

---

## Quick Copy-Paste Commands for You

Replace YOUR_USERNAME below with your GitHub username:

```bash
cd /home/user/wds-fullstack
git remote add origin https://github.com/YOUR_USERNAME/wds-williams-delivery.git
git branch -M main
git push -u origin main
```

If it asks for credentials, use GitHub Personal Access Token (classic) with repo scope, not password.

Create token at: https://github.com/settings/tokens/new

---

## After Push - What Williams Sees

When Williams opens https://github.com/YOUR_USERNAME/wds-williams-delivery, he will see:

**README.md** with:
- WDS overview, Accra Ghana, 24 riders
- Full stack: Next.js + Supabase + Expo + Paystack
- Quick start, demo logins, deployment
- Security hardening summary (9 audits)
- Cost at scale $0-25/mo

**Live Demo Links:**
- Web MVP: https://5173-xxx.e2b.app/full-mvp/
- Production: https://3000-xxx.e2b.app/
- Pitch Deck: pitch-deck/index.html → Print to PDF

**Production Ready:** Can deploy to wds.com.gh in 30 mins via Vercel + Supabase

---

Need help? Tell me your GitHub username and I'll generate exact commands with your username filled in.
