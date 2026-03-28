# GitWhisper AI

Understand any GitHub repository instantly with AI-powered code analysis, architecture insights, and team activity — all in one dashboard.

## Features

- **Free to start** — Analyse 3 public repos with no account required (device-tracked)
- **AI Code Analysis** — Plain-English explanations of every file, powered by Groq (llama-3.3-70b)
- **3D Activity Dashboard** — Commits, PRs, issues, and contributors visualised with Recharts
- **File Explorer** — Browse any file with an instant AI explanation
- **Code Metrics** — Language breakdown, directory depth, and file counts
- **README Viewer** — Rendered markdown README for any repo
- **Real-time History** — Dashboard updates live via Supabase Realtime as you analyse repos
- **Auth** — Email/password, GitHub OAuth, and Google OAuth via Supabase
- **Dark + Light theme** — Toggle with ☀️/🌙, preference saved to localStorage
- **100% responsive** — Works on mobile, tablet, and desktop

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS + CSS Variables |
| Auth + DB | Supabase (PostgreSQL + RLS + Realtime) |
| AI Engine | Groq API (llama-3.3-70b-versatile) |
| AI Fallback | Google Gemini (gemini-1.5-flash-latest) |
| Charts | Recharts |
| Animations | Framer Motion |
| Forms | Formspree |

---

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/SALMANUDDIN-TALHA-MOHD/gitwhisper-ai.git
cd gitwhisper-ai
npm install --legacy-peer-deps
```

> Use `--legacy-peer-deps` to avoid ESLint peer dependency conflicts with Next.js 14.

### 2. Set up environment variables

Create a `.env.local` file in the root:

```env
NEXT_PUBLIC_GROQ_API_KEY=gsk_...
NEXT_PUBLIC_GEMINI_API_KEY=AIzaSy...
NEXT_PUBLIC_GITHUB_TOKEN=ghp_...
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_FORMSPREE_ENDPOINT=https://formspree.io/f/xxx
```

### 3. Set up Supabase

1. Go to [supabase.com](https://supabase.com) → New project
2. SQL Editor → New Query → paste `supabase-setup.sql` → Run
3. Authentication → Providers → enable **GitHub** and **Google**
4. Authentication → URL Configuration → set:
   - Site URL: `http://localhost:3000`
   - Redirect URL: `http://localhost:3000/auth/callback`

### 4. Get API keys (all free)

| Key | Where to get it |
|---|---|
| `NEXT_PUBLIC_GROQ_API_KEY` | [console.groq.com](https://console.groq.com) → API Keys |
| `NEXT_PUBLIC_GEMINI_API_KEY` | [aistudio.google.com](https://aistudio.google.com/app/apikey) |
| `NEXT_PUBLIC_GITHUB_TOKEN` | [github.com/settings/tokens](https://github.com/settings/tokens) → classic, `public_repo` scope |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API |
| `NEXT_PUBLIC_FORMSPREE_ENDPOINT` | [formspree.io](https://formspree.io) → New Form |

### 5. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deploy to Vercel

### Step 1 — Push to GitHub

```bash
git init
git add .
git status        # confirm .env.local is NOT listed
git commit -m "Initial commit — GitWhisper AI"
git remote add origin https://github.com/SALMANUDDIN-TALHA-MOHD/gitwhisper-ai.git
git branch -M main
git push -u origin main
```

### Step 2 — Import on Vercel

1. Go to [vercel.com](https://vercel.com) → Add New Project
2. Import `gitwhisper-ai` from GitHub
3. Before clicking Deploy → **Environment Variables** → add all 6 keys from `.env.local`
4. Click **Deploy** (~2 minutes)

### Step 3 — Update Supabase for production

In Supabase → Authentication → URL Configuration:
- Site URL: `https://your-app.vercel.app`
- Redirect URLs → Add: `https://your-app.vercel.app/auth/callback`

Update GitHub OAuth app at [github.com/settings/developers](https://github.com/settings/developers):
- Homepage URL: `https://your-app.vercel.app`
- Callback URL: `https://your-app.vercel.app/auth/callback`

### Future deployments

Every `git push` to `main` automatically redeploys on Vercel.

```bash
git add .
git commit -m "Update: describe your change"
git push
```

---

## Project Structure

```
gitwhisper-ai/
├── app/
│   ├── page.tsx              # Landing page
│   ├── login/page.tsx        # Sign up / Sign in
│   ├── dashboard/page.tsx    # User dashboard (real-time history)
│   ├── repo/[owner]/[name]/  # Repository analysis
│   ├── auth/callback/        # OAuth callback handler
│   └── globals.css           # Dark + Light theme CSS variables
├── components/
│   ├── FileExplorer.tsx      # File tree + code + AI explanation
│   ├── ActivityDashboard3D.tsx  # Commits/PRs/issues charts
│   ├── CodeMetrics.tsx       # Language + depth analytics
│   ├── ReadmeViewer.tsx      # Rendered README
│   └── ...
├── lib/
│   ├── analyze.ts            # Groq + Gemini AI calls
│   ├── github.ts             # GitHub API
│   └── supabase/             # Browser + Server clients + TypeScript types
├── middleware.ts             # Protects /dashboard route
├── supabase-setup.sql        # Run once in Supabase SQL Editor
└── .env.local                # Your API keys (never committed)
```

---

## Database Schema

| Table | Description |
|---|---|
| `user_profiles` | Name, email, avatar, login count, last seen |
| `repo_analyses` | Every repo analysed per user (owner, name, URL, language, stars) |
| `contact_submissions` | Contact form submissions |
| `login_history` | Every sign-in event per user |

View your data: **Supabase → Table Editor → select `public` schema**

---

## Notes on npm audit

Running `npm audit fix --force` will upgrade Next.js to v16 which **breaks the project**. The reported vulnerabilities in Next.js 14 affect only self-hosted image optimization and dev server CORS — neither applies to this Vercel-deployed project. Safe to ignore for deployment.

To install cleanly without audit errors:
```bash
npm install --legacy-peer-deps
```

---

Built by **Salmanuddin Talha Mohd** · [GitHub](https://github.com/SALMANUDDIN-TALHA-MOHD) · [LinkedIn](https://www.linkedin.com/in/mohd-salmanuddin-talha/)
