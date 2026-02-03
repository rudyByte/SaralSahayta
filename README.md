# SahayoG - Universal Scheme Gateway

A comprehensive scholarship and government scheme aggregation platform connecting eligible citizens with financial assistance programs across India.

## 🎯 Project Overview

SahayoG (Saral Sahayta) is an AI-powered platform designed to democratize access to 5,000+ government schemes through intelligent matching, automated application assistance, and comprehensive document support.

## 🚀 Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: TailwindCSS with custom design system
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Validation**: Zod
- **UI Components**: Radix UI
- **Icons**: Lucide React

## 📦 Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your actual values

# Set up database
npx prisma generate
npx prisma db push

# Run development server
npm run dev
```

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

### Phase 1: Foundation & MVP Core ✅
- [x] Project initialization
- [ ] Authentication system
- [ ] Database schema
- [ ] Core UI components

### Phase 2: Scheme Discovery
- [ ] Scheme database integration
- [ ] AI-powered matching engine
- [ ] Search and filter functionality

### Phase 3: Document Intelligence
- [ ] Document tracking system
- [ ] Procurement guides
- [ ] Document vault

### Phase 4: Application Management
- [ ] Application workflow
- [ ] Form pre-filling
- [ ] Status tracking

## 🔒 Environment Variables

See `.env.local.example` for required environment variables.

## 📄 License

Proprietary - All rights reserved

## 👥 Team

Product Management Team - SahayoG Platform

---

**Version**: 1.0  
**Last Updated**: February 2026
