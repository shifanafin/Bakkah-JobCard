# AutoEdge Pro — Workshop Management System

Built with Next.js 15, Supabase, NextAuth v5, Cloudinary · Al Qusais, Dubai

---

## ⚡ Quick Start (5 steps)

### Step 1 — Install dependencies
```bash
npm install
```

### Step 2 — Set up Supabase
1. Go to [supabase.com](https://supabase.com) → create a new project
2. Go to **SQL Editor** → paste the entire contents of `supabase/migrations/001_job_card_schema.sql` → click **Run**
3. All 9 tables, triggers, and seed data are created automatically

### Step 3 — Set up Cloudinary
1. Sign up at [cloudinary.com](https://cloudinary.com)
2. From your dashboard, copy: Cloud Name, API Key, API Secret

### Step 4 — Environment variables
Copy `.env.local` and fill in your values:
```
NEXT_PUBLIC_SUPABASE_URL=        ← from Supabase → Settings → API
NEXT_PUBLIC_SUPABASE_ANON_KEY=   ← from Supabase → Settings → API
SUPABASE_SERVICE_ROLE_KEY=       ← from Supabase → Settings → API
AUTH_SECRET=                     ← run: openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000
CLOUDINARY_CLOUD_NAME=           ← from Cloudinary dashboard
CLOUDINARY_API_KEY=              ← from Cloudinary dashboard
CLOUDINARY_API_SECRET=           ← from Cloudinary dashboard
```

### Step 5 — Run
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

**Login:** admin@autoedgepro.ae / admin123

---

## 📁 Project Structure

```
autoedge-pro/
├── app/
│   ├── auth/login/          ← Login page
│   ├── workshop/
│   │   ├── dashboard/       ← Main dashboard
│   │   └── job-cards/
│   │       ├── page.tsx     ← Job cards list + Excel export
│   │       ├── new/         ← Create new job card
│   │       └── [id]/
│   │           ├── page.tsx     ← Job card detail
│   │           └── invoice/     ← Print-ready UAE VAT invoice
│   ├── api/
│   │   ├── auth/            ← NextAuth endpoint
│   │   └── cloudinary/      ← Sign + delete endpoints
│   ├── auth.ts              ← NextAuth v5 config
│   └── layout.tsx           ← Root layout
├── components/
│   ├── layout/              ← Sidebar, Header
│   └── job-card/            ← StatusStepper, LineItems, PhotoUpload
├── lib/
│   ├── supabase/            ← Client + server Supabase clients
│   ├── hooks/               ← useCloudinaryUpload
│   ├── utils/               ← cn(), formatAED(), formatDate()
│   └── queries.ts           ← All database queries
├── types/index.ts           ← All TypeScript types
└── supabase/migrations/     ← SQL schema
```

## 🚀 Deploy to Vercel

```bash
git add . && git commit -m "initial" && git push
```
1. Go to [vercel.com](https://vercel.com) → Import your GitHub repo
2. Add all environment variables
3. Deploy → done!

---

## 🔑 Features

- ✅ NextAuth v5 authentication (email + password)
- ✅ Protected routes via middleware
- ✅ Job cards: create, view, update status
- ✅ Status pipeline: Received → In Progress → QC Check → Ready → Delivered
- ✅ Services & parts line items with auto-totals
- ✅ UAE VAT 5% auto-calculation
- ✅ Discount support
- ✅ Payment status (Unpaid / Partial / Paid)
- ✅ Vehicle photos via Cloudinary (all angles + damage + before/after)
- ✅ Print-ready UAE Tax Invoice (PDF via browser print)
- ✅ Excel export with VAT Summary sheet
- ✅ Dark luxury UI (#ff7f0a brand, Bebas Neue display font)
- ✅ Mobile-responsive
- ✅ Supabase Row Level Security
- ✅ Auto job number generation (JC-2026-0001)
