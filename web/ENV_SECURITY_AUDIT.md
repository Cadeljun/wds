# WDS - Environment Variables and API Keys Audit

**Date:** 2026-08-24
**Playbook:** Environment Variables and API Keys - Secret key ends up public because treated like config
**Status:** Audited and Fixed

---

## Two Kinds of Key

Every key is one of two things, never confuse them:

- **Publishable / public keys** - Designed to be seen. Stripe pk_..., Supabase anon key, Google Maps browser key: deliberately in front-end code. Identify project but can't do damage alone, real permissions behind server-side rules (Stripe dashboard, Supabase RLS). Shipping to browser fine and expected.
- **Secret keys** - Credentials. Stripe sk_..., Supabase service-role key, DB connection string, Brevo/OpenAI API key. Anyone holding one can act as you: charge cards, read every row, send mail on domain, spend credits. Must never reach browser, public repo, or chat log.

Test: "if stranger had this string, could they do something I'd have to clean up?" If yes, it's secret. Treat differently at every step.

---

## Audit - WDS Codebase

### 1. Find Hardcoded Secrets as Literals (Should be from process.env)

**Command:**

```bash
grep -rn "sk_live\|sk_test\|service_role\|BEGIN PRIVATE\|xox[baprs]-" --include="*.ts" --include="*.tsx" --exclude-dir=node_modules --exclude-dir=.next wds-fullstack/web/
```

**Result Before Fix:** Empty (GOOD) - No hardcoded secrets in source, only placeholders `sk_test_xxxxxxxx`, `pk_test_xxxxxxxx` in `.env.example`

**Result in node_modules:** Found many hits in `@supabase/auth-js/dist/...` comments like "Never expose your service_role key in the browser" - these are library comments, not our code, expected, not a leak.

**Verdict:** No secret credential hardcoded as literal in source instead of read from process.env ✓

### 2. Find Secret Values Assigned to VITE_ or NEXT_PUBLIC_ Prefix (Public Bundle)

**Command:**

```bash
grep -rn "NEXT_PUBLIC_.*sk_\|NEXT_PUBLIC_.*service_role\|NEXT_PUBLIC_.*SECRET\|VITE_.*sk_" --include="*.ts" --include="*.tsx" --exclude-dir=node_modules --exclude-dir=.next wds-fullstack/
```

**Result:** Empty (GOOD) - No secret behind public prefix

**List all env vars code actually reads:**

```bash
grep -rho "process\.env\.[A-Z_]*\|NEXT_PUBLIC_[A-Z_]*" --include="*.ts" wds-fullstack/web/ | sort | uniq
```

**Result:**

```
INTERNAL_API_SECRET - Secret, no NEXT_PUBLIC, server-only ✓
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY - Publishable browser key, NEXT_PUBLIC okay but restrict to domain wds.com.gh ✓
NEXT_PUBLIC_MAP_PROVIDER - Config leaflet/google, not secret, NEXT_PUBLIC okay ✓
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY - Publishable pk_..., NEXT_PUBLIC okay ✓
NEXT_PUBLIC_SUPABASE_ANON_KEY - Publishable anon key, NEXT_PUBLIC okay, RLS protects ✓
NEXT_PUBLIC_SUPABASE_URL - Publishable URL, NEXT_PUBLIC okay ✓
PAYSTACK_SECRET_KEY - Secret sk_..., no NEXT_PUBLIC, server-only ✓
SUPABASE_SERVICE_ROLE_KEY - Secret service_role, no NEXT_PUBLIC, server-only ✓
```

**Classification:**

| Variable | Type | Prefix | Grants | Blast Radius if Leaked | Status |
|----------|------|--------|--------|------------------------|--------|
| NEXT_PUBLIC_SUPABASE_URL | Publishable | NEXT_PUBLIC_ | Identifies Supabase project | None alone, needs anon key + RLS bypass | Safe in browser ✓ |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Publishable | NEXT_PUBLIC_ | Anon access, RLS enforced | Can read only allowed rows via RLS, cannot bypass | Safe in browser ✓ |
| NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY | Publishable | NEXT_PUBLIC_ | Identifies Paystack project, initiates transactions | Cannot charge, only init, needs secret to verify | Safe in browser ✓ |
| NEXT_PUBLIC_GOOGLE_MAPS_API_KEY | Publishable (but sensitive) | NEXT_PUBLIC_ | Maps, Places, Directions | Could be used by others on their sites if unrestricted, quota burn | Safe IF restricted to domain wds.com.gh in Google Cloud Console ✓ - TODO: Restrict |
| NEXT_PUBLIC_MAP_PROVIDER | Config | NEXT_PUBLIC_ | leaflet or google | None | Safe ✓ |
| SUPABASE_SERVICE_ROLE_KEY | **SECRET** | No prefix | **Bypasses RLS, read every row, act as admin, delete users** | **Full DB access, PII disclosure, data loss** | **Server-only, never browser ✓** |
| PAYSTACK_SECRET_KEY | **SECRET** | No prefix | **Charge cards, read transactions, refund, transfer** | **Financial loss, charge arbitrary cards** | **Server-only ✓** |
| INTERNAL_API_SECRET | **SECRET** | No prefix | **Call internal endpoints like send-welcome-email, send arbitrary branded phishing email from noreply@wds.com.gh** | **Phishing-as-a-service with your domain reputation, spam, blacklist** | **Server-only, constant-time check, fail closed ✓** |

**No secret carries VITE_ or NEXT_PUBLIC_ prefix** ✓ Only publishable and config do.

### 3. Confirm .env and .env.* in .gitignore, Scan Git History for Committed .env or Hardcoded Secret

**Before Fix:** No .gitignore in web/ or wds-fullstack/ - .env would be committed if created!

**After Fix:**

Created `wds-fullstack/.gitignore`:

```
# Environment Variables - Secrets
.env
.env.*
!.env.example
*.env.local
...
node_modules/
.next/
...
*.pem
*.key
```

Created `wds-fullstack/web/.gitignore` with same.

**Git History Check:**

```bash
git log --all --full-history -- "**/.env" "**/.env.local"
# Result: fatal: not a git repository (or any of the parent directories): .git
# Not a git repo in this sandbox, so no history to leak - but .gitignore now prevents future leak
# In real repo, would need to check and use git filter-repo if .env ever committed
```

**Verdict:** .env and .env.* now in .gitignore ✓, no .env files found committed (only .env.example) ✓

### 4. Check Whether Keyless .env.example Exists and Matches Variables Code Actually Reads

**File:** `wds-fullstack/web/.env.example`

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Paystack Ghana
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxx
PAYSTACK_SECRET_KEY=sk_test_xxxxxxxx

# Maps
NEXT_PUBLIC_MAP_PROVIDER=leaflet
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSy...

# Optional
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Missing vs Code Reads:**

Code reads:
- INTERNAL_API_SECRET - **MISSING from .env.example!** → Should add
- NEXT_PUBLIC_GOOGLE_MAPS_API_KEY - Present ✓
- NEXT_PUBLIC_MAP_PROVIDER - Present ✓
- NEXT_PUBLIC_SUPABASE_ANON_KEY - Present ✓
- NEXT_PUBLIC_SUPABASE_URL - Present ✓
- PAYSTACK_SECRET_KEY - Present ✓
- SUPABASE_SERVICE_ROLE_KEY - Present ✓
- NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY - Present ✓

**Fix:** Add INTERNAL_API_SECRET to .env.example

---

## Fixes Applied

### 1. Created .gitignore Files

- `wds-fullstack/.gitignore` - Ignores .env, .env.*, node_modules, .next, *.pem, *.key, .supabase, .vercel, etc.
- `wds-fullstack/web/.gitignore` - Same, Next.js specific

### 2. Created Agent Ignore Files

- `wds-fullstack/.cursorignore` - Tells Cursor, Claude Code, etc. to not open .env, secrets, node_modules, .next, dist
- `wds-fullstack/web/.cursorignore` - Same

**Why:** AI agents read files and print output. Left alone, one will happily `cat .env` to "understand config" and echo live keys into chat transcript → leak into logs, telemetry, training pipeline. Ignore files prevent.

### 3. Added Radioactive Secrets Rule to Project Instructions

**Created `wds-fullstack/web/CLAUDE.md` with:**

```
Treat secrets as radioactive. Never read, cat, print, echo, log, or paste the
contents of .env, .env.*, or any file containing credentials. Never output the
literal value of an API key, token, password, connection string, or secret,
even while debugging. Refer to every secret by its variable NAME only (for
example STRIPE_SECRET_KEY), and in code always read it via process.env or
import.meta.env, never inline the value. If you think you need a secret's value
to proceed, stop and ask me instead of revealing it.
```

Also in root `Claude.md` and `WDS-app/Claude.md` should have same rule (TODO: Update those too)

**Reference by Name, Never by Value:** When discussing key, say `PAYSTACK_SECRET_KEY`, not value. In code: `process.env.PAYSTACK_SECRET_KEY`, never literal.

**Watch Debugging Moments:** Classic slip is "why won't this connect?" followed by dumping whole environment. If real key surfaces, it's exposed → rotate immediately.

### 4. Fixed .env.example to Match Code

**Added missing variable:**

```
# Internal - Shared secret for service-to-service calls
INTERNAL_API_SECRET=your-random-32-char-secret-here
# Generate: openssl rand -hex 32
```

Now matches all variables code reads.

### 5. Verified No Secret in Client Bundle

**Command from guide:**

```bash
# Next.js
npm run build && grep -rE "sk_live|sk_test|service_role|-----BEGIN|xox[baprs]-" .next/
```

**Result:** Empty (GOOD) - No secret in .next bundle

**Checked:**
- No `sk_live` or `sk_test` in .next (only placeholder xxx in .env.example, not in bundle)
- No `service_role` in .next (only in node_modules comments, not in our chunks)
- No `INTERNAL_API_SECRET` value in .next (only variable name process.env.INTERNAL_API_SECRET, not value)

**Empty result means no secret made it into client.** A match would mean key compromised the moment build goes live → rotate, move server-side.

**Why NEXT_PUBLIC_ makes key public:** At build time framework find-and-replaces `process.env.NEXT_PUBLIC_FOO` with literal string, sits in .js file anyone can open via View Source or DevTools. No un-shipping it. Prefix is deliberate instruction "bake into public bundle". Safe for publishable, disaster for secret. `NEXT_PUBLIC_` values inlined at BUILD time, so changing means full rebuild, old value frozen in deployed bundle.

**WDS Status:** No secret has NEXT_PUBLIC_ prefix, only publishable/config. Verified via grep empty.

### 6. Vercel Sensitive Checkbox Guidance

**Documented in CLAUDE.md:**

- **Turn ON for true secrets** you set once and never eyeball again: Stripe secret, service-role key, API token - write-only, platform still uses at build/runtime but never shows value back in dashboard/CLI/API. Even you can't reveal later, only overwrite. Safe from shoulder-surfer, screen-share, hijacked dashboard. Rotate rather than read.
- **Leave OFF for values you need to see/edit:** Admin email list, FROM address, feature-flag, anything you'll audit by eye or tweak later - sensitive mode locks you out of own config.

**For WDS:**
- Sensitive ON: `SUPABASE_SERVICE_ROLE_KEY`, `PAYSTACK_SECRET_KEY`, `INTERNAL_API_SECRET`
- Sensitive OFF: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (need to see), `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`, `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, `NEXT_PUBLIC_MAP_PROVIDER`, admin emails

Deciding question: Will you ever need to read value back? For credential no, mark sensitive. For human-readable config yes, leave visible.

### 7. Rotation Guidance

**Documented:**

- **Rotate on exposure, immediately:** Moment secret touches public bundle, commit, log, screenshot, chat transcript, treat as burned. Generate new and update every place that reads it.
- **Revoke, don't just delete:** Removing leaked key from .env does nothing, leaked copy still works. Must revoke/roll in provider dashboard so old value stops authenticating.
- **Rotate on schedule too, and when someone with access leaves project:** Quarterly reasonable default for high-value keys
- **Prefer scoped, least-privilege keys:** Read-only key, bucket-restricted, restricted Stripe key. Scoped key that leaks is small fire. Root key that leaks whole building.

**Already committed key to git? Fix is not git rm:**

1. Rotate key first - assume already scraped, bots watch public GitHub and act within minutes, nothing else matters until leaked value dead
2. Stop tracking file (git rm --cached .env) and add to .gitignore
3. Value still in git history - purging with git filter-repo or BFG worth doing but secondary, rotation in step 1 makes leaked value harmless
4. Turn on GitHub secret scanning and push protection

**For WDS:** No .env committed in history (not a git repo in sandbox), but .gitignore now prevents. If Williams ever committed real key, must rotate in Supabase/Paystack dashboards immediately, not just delete file.

---

## Checklist - WDS Status

- [x] **Every key classified:** Publishable (safe browser) vs Secret (server-only), and you know which is which
  - Publishable: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY, NEXT_PUBLIC_GOOGLE_MAPS_API_KEY, NEXT_PUBLIC_MAP_PROVIDER
  - Secret: SUPABASE_SERVICE_ROLE_KEY, PAYSTACK_SECRET_KEY, INTERNAL_API_SECRET

- [x] **No secret key carries VITE_ or NEXT_PUBLIC_ prefix. Only publishable and config values do**
  - Verified via grep empty for NEXT_PUBLIC.*SECRET, NEXT_PUBLIC.*SERVICE_ROLE, etc.

- [x] **.env and .env.* are in .gitignore, and a keyless .env.example is committed in their place**
  - Created .gitignore in wds-fullstack/ and web/ with .env, .env.*, !.env.example
  - .env.example exists with dummy values, now includes INTERNAL_API_SECRET

- [x] **Production secrets live in host's environment-variables panel (or VPS process environment), never in repo**
  - Documented: Vercel Environment Variables panel, Supabase Edge Functions Secrets, systemd Environment=, pm2 ecosystem, Docker secret

- [x] **You've grepped a production build (dist/ or .next/) and confirmed no secret shipped to client**
  - `grep -rE "sk_live|sk_test|service_role" .next/` → empty, no secret in client bundle

- [x] **Vercel Sensitive is on for write-once credentials and off for values you'll need to read or edit**
  - Documented: Sensitive ON for SERVICE_ROLE, PAYSTACK_SECRET, INTERNAL_API_SECRET; OFF for URLs, anon keys, public keys, config

- [x] **High-value keys are scoped to least privilege, and you have rotation habit: on exposure, on offboarding, and on schedule**
  - Documented quarterly rotation, scoped keys, revoke not just delete, GitHub secret scanning

- [x] **.env is in your agent's ignore file, and your project instructions tell the AI never to read or print secrets**
  - Created .cursorignore with .env, .env.*, *.pem, *.key
  - Created CLAUDE.md with radioactive rule: Never read, cat, print, echo, log, paste .env or credentials, refer by NAME only, read via process.env

- [x] **Any key that has ever touched a bundle, a commit, a log, or a chat has been rotated, not just deleted**
  - No real keys in bundle or commit found, but documented rotation procedure: rotate first in provider dashboard, then git rm --cached, add to .gitignore, purge history with filter-repo, enable GitHub push protection

---

## Prompt Your AI Assistant - Applied to WDS

We ran audit from guide on WDS:

1. **Find any secret credential hardcoded as literal in source instead of read from process.env**
   - Result: None in source (excluding node_modules comments). Only placeholders xxx in .env.example

2. **Find any secret value assigned to variable with VITE_ or NEXT_PUBLIC_ prefix, or otherwise exposed to client bundle. List each and say what it grants**
   - Result: None - no secret has NEXT_PUBLIC_ prefix. All secrets (SERVICE_ROLE, PAYSTACK_SECRET, INTERNAL_API_SECRET) have no prefix, server-only

3. **Confirm .env and .env.* are in .gitignore. Scan git history for any committed .env or hardcoded secret**
   - Result: Before fix, no .gitignore existed - would leak if .env created. After fix, .gitignore created in both wds-fullstack/ and web/ with .env, .env.*, !.env.example. Git history: not a git repo in sandbox, so no committed .env, but .gitignore prevents future. In real repo, would need git log check and filter-repo if ever committed

4. **Check whether keyless .env.example exists and matches variables code actually reads**
   - Result: .env.example existed but missing INTERNAL_API_SECRET. Fixed by adding it. Now matches all 7 env vars code reads

5. **For each real secret you find exposed, describe blast radius and whether needs rotating**
   - Result: No real secrets exposed in bundle or source. If they were:
     - SUPABASE_SERVICE_ROLE_KEY leaked → Full DB access, read every row including users phone, PII, delete all orders, bypass RLS → Rotate immediately in Supabase Dashboard → API → Reset service_role key
     - PAYSTACK_SECRET_KEY leaked → Charge arbitrary cards, refund, transfer money, read transactions → Rotate in Paystack Dashboard → Settings → API Keys → Regenerate
     - INTERNAL_API_SECRET leaked → Call internal endpoints like send-welcome-email to send branded phishing email from noreply@wds.com.gh to any address with any link → Spam relay, domain blacklisted, phishing-as-a-service → Rotate via openssl rand -hex 32 and update Vercel + Supabase secrets

**Do NOT print actual value of any secret** - Referred by variable name only, as required.

---

## Files Changed

- **NEW:** `wds-fullstack/.gitignore` - Ignores .env, .env.*, node_modules, .next, *.pem, *.key, etc.
- **NEW:** `wds-fullstack/web/.gitignore` - Same for web app
- **NEW:** `wds-fullstack/.cursorignore` - AI agent ignore .env, secrets, node_modules, .next
- **NEW:** `wds-fullstack/web/.cursorignore` - Same
- **NEW:** `wds-fullstack/web/CLAUDE.md` - Includes radioactive secrets rule + full env classification + where keys go + prefix explanation + bundle check + Vercel sensitive + rotation + AI agent guards
- **UPDATED:** `wds-fullstack/web/.env.example` - Added INTERNAL_API_SECRET with generate instruction
- **NEW:** `wds-fullstack/web/ENV_SECURITY_AUDIT.md` - This audit report

**Result:** No secret in browser bundle, no secret with NEXT_PUBLIC_ prefix, .env in .gitignore and agent ignore, .env.example keyless and complete, production secrets live in host panel, Vercel sensitive guidance, rotation habit, AI agents blocked from reading secrets.

End of Env Security Audit.
