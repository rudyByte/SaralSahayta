# Saral Sahayta - Universal Scheme Gateway

A comprehensive scholarship and government scheme aggregation platform connecting eligible citizens with financial assistance programs across India.

## 🎯 Project Overview

Saral Sahayta is an AI-powered platform designed to democratize access to 5,000+ government schemes through intelligent matching, automated application assistance, and comprehensive document support.

## 🚀 Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: TailwindCSS with custom design system
- **Backend & Auth**: Supabase (PostgreSQL, Auth, Storage, Real-time)
- **Data Fetching**: SWR (Stale-While-Revalidate)
- **Forms**: React Hook Form + Zod
- **Intelligence**: Tesseract.js (OCR), Custom Matching Algorithm
- **Animation**: Framer Motion
- **UI Components**: Radix UI + Lucide Icons

## 📦 Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your actual Supabase credentials

# Set up local Prisma types
npx prisma generate

# Run development server
npm run dev
```

## 🛠️ Database & Storage Setup
For collaborators setting up the project for the first time:
1. Ensure your `.env.local` has the correct `NEXT_PUBLIC_SUPABASE_URL` and keys.
2. Run the SQL scripts located in the `/scripts` directory in your Supabase SQL Editor:
   - `optimize-db.sql`: For performance indexes.
   - `phase_8_setup.sql`: For Storage buckets, RLS policies, and application tables.

## 🏗️ Project Structure

```
sahayog/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication routes
│   ├── (dashboard)/       # Dashboard routes
│   ├── api/               # API routes
│   └── page.tsx           # Landing page
├── components/            # React components
│   ├── ui/               # Base UI components
│   ├── navigation/       # Navigation components
│   ├── scheme/           # Scheme-related components
│   └── profile/          # Profile components
├── lib/                   # Utility functions
├── prisma/               # Database schema
├── types/                # TypeScript types
└── public/               # Static assets
```

## 🎨 Design System

### Color Palette
- **Primary**: #2E5090 (Blue)
- **Secondary**: #1F4E78 (Dark Blue)
- **Accent**: #5B9BD5 (Light Blue)
- **Success**: #28A745
- **Warning**: #FFC107
- **Danger**: #DC3545

## 📝 Development Phases

### Phase 1-7: Foundation & Core Experience ✅
- [x] Supabase Auth & Session Management
- [x] AI-Powered Scheme Matching Engine
- [x] Scheme Discovery & Filtering (SWR Optimized)
- [x] Responsive Global Navigation
- [x] Reactive Profile Management

### Phase 8: Document Intelligence & Advanced Features [/]
- [x] Supabase Storage Infrastructure
- [ ] OCR-based Document Verification
- [ ] Multi-step Application Workflow
- [ ] Real-time Status Tracking

## 🔒 Environment Variables

See `.env.local.example` for required environment variables.

## 📄 License

Proprietary - All rights reserved

## 👥 Team

Product Management Team - Saral Sahayta Platform

---

**Version**: 1.0  
**Last Updated**: February 2026
