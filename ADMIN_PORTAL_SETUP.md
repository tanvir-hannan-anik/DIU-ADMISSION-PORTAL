# DIU Admin Portal — Full Setup Guide

This guide takes the admin portal from "running with demo data" to "fully operational
with real analytics, security, and data." Do the parts in order — each **Part** is
self-contained, and the ⏱️ tag shows roughly how long it takes.

> Legend:
> 🟢 = required to operate · 🟡 = recommended · 🔵 = advanced / later phase
> 🧑‍💻 = something **you** do in a dashboard/account · ⌨️ = a code/dev step (I can do these)

---

## Part 0 — How the pieces fit together

```
Public website (React)  ──tracks events──►  PostHog + Clarity (analytics SaaS)
        │                                            │
        │ forms / logins                             │ (admin reads via API)
        ▼                                            ▼
Spring Boot API  ◄───────────────  Admin Portal (/admin, React)
        │
        ▼
Supabase Postgres (leads, applications, audit logs, admin users)
```

- **Visitor analytics / heatmaps / funnels** → live in PostHog + Clarity (you embed a
  script on the public site; the admin dashboard reads it back).
- **Leads / Applications / Audit logs / Admin users** → live in **your** Supabase DB.
- **Auth & API** → Spring Boot, secured by JWT + role-based access (already built).

---

## Part 1 — 🟢 Local development (verify everything runs) ⏱️ 10 min

### 1.1 Prerequisites
- **Java 17+** (`java -version`), **Maven** (`mvn -v`)
- **Node 18+** (`node -v`), **npm**

### 1.2 Start the backend (uses in-memory H2 — no DB needed locally)
```bash
cd backend-spring-boot
mvn spring-boot:run
```
Local admin credentials default to (in `application.properties`):
- Email: `admin@diu.edu.bd`
- Password: `ChangeMe@Admin#2026`

To override locally without editing files, set env vars first:
```bash
# Git Bash / Linux / macOS
ADMIN_EMAIL="you@diu.edu.bd" ADMIN_PASSWORD="YourStrongPass#1" mvn spring-boot:run
```
```powershell
# PowerShell
$env:ADMIN_EMAIL="you@diu.edu.bd"; $env:ADMIN_PASSWORD="YourStrongPass#1"; mvn spring-boot:run
```

### 1.3 Start the frontend
```bash
cd frontend-react
npm install
npm start
```
Open **http://localhost:3000/admin** and log in.

### 1.4 Smoke test (optional, from PowerShell)
```powershell
$b='{"email":"admin@diu.edu.bd","password":"ChangeMe@Admin#2026"}'
Invoke-RestMethod -Uri "http://localhost:8080/api/v1/auth/login" -Method Post -ContentType "application/json" -Body $b
```
You should get back `role = admin` and a token.

---

## Part 2 — 🟢 Production security & deployment (Render) ⏱️ 20 min

### 2.1 Generate strong secrets
```bash
# JWT secret (32+ chars)
openssl rand -base64 48
# Admin password (or pick your own strong one)
openssl rand -base64 18
```
No openssl? In PowerShell:
```powershell
[Convert]::ToBase64String((1..48 | % {Get-Random -Max 256}))
```

### 2.2 Set env vars on the Spring service
Render Dashboard → **diu-spring-api** → **Environment** → add:

| Key | Value | Notes |
|-----|-------|-------|
| `ADMIN_EMAIL` | your admin email | the ONLY admin login |
| `ADMIN_PASSWORD` | the strong password from 2.1 | re-synced on every boot |
| `JWT_SECRET` | the random string from 2.1 | 🟢 must be long & secret |
| `DB_PASSWORD` | your Supabase password | already required |

These keys are already declared in `render.yaml` as `sync: false`, so Render will prompt
for them. **Never commit these values to git.**

### 2.3 Deploy
- Push your branch to GitHub → Render auto-deploys (or click **Manual Deploy**).
- On boot, `DataSeeder` creates/updates the admin account from the env vars.

### 2.4 Verify production
Open **https://diu-frontend.onrender.com/admin** → log in with `ADMIN_EMAIL` / `ADMIN_PASSWORD`.
Check **Audit Logs** in the sidebar — your login should appear with IP + timestamp.

### 2.5 🟡 Lock down CORS
In Render → diu-spring-api env, confirm `CORS_ALLOWED_ORIGINS` points only to your real
frontend URL (it already maps to `diu-frontend` via `fromService`). Don't use `*`.

---

## Part 3 — 🟢 Visitor analytics with PostHog ⏱️ 30 min

PostHog gives you visitors, traffic sources, page analytics, funnels, events, and (with
its toolbar) basic heatmaps — most of the "Analytics" sidebar section.

### 3.1 🧑‍💻 Create the project
1. Sign up at **https://posthog.com** (free tier is generous) — pick **EU** or **US** cloud.
2. Create a project named "DIU Website".
3. Copy two values from **Project Settings**:
   - **Project API Key** (starts with `phc_...`)
   - **API Host** (e.g. `https://us.i.posthog.com` or `https://eu.i.posthog.com`)

### 3.2 ⌨️ Add the tracking snippet to the PUBLIC site
Paste into `frontend-react/public/index.html` just before `</head>`:
```html
<!-- PostHog -->
<script>
  !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){
  function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){
  t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",
  p.async=!0,p.src=s.api_host+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);
  var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){
  var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){
  return u.toString(1)+".people (stub)"},o="init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey getNextSurveyStep identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},
  e.__SV=1)}(document,window.posthog||[]);
  posthog.init('phc_YOUR_PROJECT_KEY', { api_host: 'https://us.i.posthog.com' });
</script>
```
Replace `phc_YOUR_PROJECT_KEY` and the host. Page views are captured **automatically**.

### 3.3 ⌨️ Track custom events (the important ones for admissions)
Anywhere in the public app, call:
```js
window.posthog?.capture('apply_now_clicked', { department: 'CSE' });
window.posthog?.capture('application_submitted', { program: 'BSc CSE' });
window.posthog?.capture('scholarship_viewed');
```
Recommended events: `apply_now_clicked`, `eligibility_checked`, `application_submitted`,
`scholarship_viewed`, `department_viewed`, `chatbot_opened`.

### 3.4 🧑‍💻 Build the funnel in PostHog
PostHog → **Funnels** → add steps: Pageview `/` → `department_viewed` →
`eligibility_checked` → `apply_now_clicked` → `application_submitted`. This powers the
"User Journey / Drop-off" analysis.

### 3.5 🔵 Wire real numbers into the admin dashboard (Phase 2 dev)
To replace the demo KPI/charts with live data, the backend calls the **PostHog Query API**
with a **Personal API Key** and the admin reads it. This is a code step I implement later —
for now, view data directly in PostHog.

---

## Part 4 — 🟢 Heatmaps & session replay with Microsoft Clarity ⏱️ 15 min

Clarity is free and unlimited, and does click/scroll heatmaps + full session recordings —
exactly the "Heatmaps" and "Session Replays" sidebar items.

### 4.1 🧑‍💻 Create the project
1. Sign up at **https://clarity.microsoft.com**.
2. New project → name "DIU Website" → website URL.
3. Copy the **Clarity Project ID** (10-char string).

### 4.2 ⌨️ Add the snippet to `public/index.html` (before `</head>`)
```html
<!-- Microsoft Clarity -->
<script type="text/javascript">
  (function(c,l,a,r,i,t,y){
    c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
    t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
    y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
  })(window, document, "clarity", "script", "YOUR_CLARITY_PROJECT_ID");
</script>
```

### 4.3 🧑‍💻 View / embed
- Watch recordings & heatmaps directly in the Clarity dashboard.
- Later (Phase 2) we embed Clarity dashboards into the admin via its share/embed links.

---

## Part 5 — 🟡 Google Analytics 4 (optional, extra traffic detail) ⏱️ 15 min

1. 🧑‍💻 **https://analytics.google.com** → Admin → Create Property → Web data stream.
2. Copy the **Measurement ID** (`G-XXXXXXX`).
3. ⌨️ Add to `public/index.html`:
```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXX');
</script>
```
> PostHog already covers most of this — only add GA4 if you specifically need it.

---

## Part 6 — 🟢 Leads / CRM / Applications (your database) ⏱️ Phase 1 dev

These are **not** SaaS — they live in your Supabase DB and need backend work (which I build
in Phase 1). Here's what it involves and what **you** supply:

### 6.1 ⌨️ Tables I will create
- `leads` (id, name, email, phone, interested_department, source, status, score,
  assigned_counselor_id, created_at)
- `lead_activities` (follow-ups, notes, status changes)
- `counselors` (name, email)
- `roles` / `permissions` (for RBAC beyond the single super-admin)

### 6.2 ⌨️ Capture wiring
- The public **admission/contact/login forms** POST into `leads` automatically.
- Existing `admission_applications` data gets surfaced in "Applications".

### 6.3 🧑‍💻 Data YOU enter through the admin panel (once built)
- **Counselors** (names + emails) so leads can be assigned.
- **Roles & permissions**: define Super Admin / Admission Officer / Marketing / Faculty
  Admin and who can see what.
- **Lead pipeline stages** (e.g. New → Contacted → Application Started → Submitted →
  Admitted) if you want custom stages.

---

## Part 7 — 🟢 Chatbot analytics ⏱️ Phase 3 dev

Your AI chatbot lives in `backend-python`. To populate "Chat Analytics":
- ⌨️ Enable **conversation logging** in the Python service (store each Q&A, response time,
  whether it was answered).
- 🧑‍💻 Nothing to enter manually — it fills from real chats once logging is on.

---

## Part 8 — 🔵 Marketing intelligence (ROI, cost-per-lead) ⏱️ advanced

Needs ad-platform API access + your spend data:

### 8.1 🧑‍💻 Get API credentials
- **Meta/Facebook**: developers.facebook.com → create an app → **Marketing API** →
  generate a long-lived access token + your Ad Account ID.
- **Google Ads**: get a **Developer Token** + OAuth client (Google Ads API).
- **Instagram**: covered by the Meta Graph API (same app).

### 8.2 🧑‍💻 Provide spend figures
ROI / Cost-per-Lead = **ad spend ÷ leads**. Enter monthly spend per campaign (or pull it
from the APIs above). UTM tags on your ad links connect spend → traffic → leads.

### 8.3 ⌨️ I integrate these as backend connectors (later phase).

---

## Part 9 — 🔵 AI Admission Intelligence ⏱️ later

- Lead scoring / admission probability / drop-off prediction need **historical data first**
  (a few weeks/months of leads + outcomes). Don't expect meaningful numbers on day one.
- Once data exists, I build the scoring using your existing Groq/Qdrant stack.

---

## Part 10 — 🟡 Security hardening checklist

- [ ] Changed `ADMIN_PASSWORD` from the default, set a strong one in Render.
- [ ] Set a long random `JWT_SECRET` in Render (not the bundled default).
- [ ] `CORS_ALLOWED_ORIGINS` restricted to your real frontend domain.
- [ ] HTTPS only (Render provides this automatically).
- [ ] (Later) Enable **2FA/TOTP** for admin login.
- [ ] (Later) Move login-lockout state to Redis if you scale to multiple API instances.
- [ ] Review **Audit Logs** in the admin periodically for failed/locked logins.

---

## Recommended order to actually do this

1. **Part 2** — secure & deploy (env vars). *(15 min, do first)*
2. **Part 3 + Part 4** — PostHog + Clarity scripts on the public site → real analytics start
   flowing immediately. *(45 min)*
3. **Part 6 (Phase 1 dev)** — I build Leads/CRM + Applications so those cards show real DB
   data.
4. **Part 7** — chatbot logging.
5. **Part 5 / 8 / 9** — optional/advanced as you need them.

---

### Quick reference — all environment variables

| Variable | Where | Purpose |
|----------|-------|---------|
| `ADMIN_EMAIL` | Render · diu-spring-api | Admin login email |
| `ADMIN_PASSWORD` | Render · diu-spring-api | Admin login password |
| `JWT_SECRET` | Render · diu-spring-api | Signs auth tokens |
| `DB_PASSWORD` | Render · diu-spring-api | Supabase Postgres |
| `CORS_ALLOWED_ORIGINS` | Render · diu-spring-api | Allowed frontend origin |
| PostHog key + host | `public/index.html` | Visitor analytics |
| Clarity project ID | `public/index.html` | Heatmaps + replays |
| GA4 Measurement ID | `public/index.html` | (optional) traffic |
| Meta / Google Ads tokens | backend connectors (later) | Marketing ROI |
