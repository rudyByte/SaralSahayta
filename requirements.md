# Requirements Specification: Saral Sahayta

## 1. Project Overview
**Saral Sahayta** is a "Universal Scheme Gateway" designed to bridge the gap between Indian citizens and the 5,000+ government schemes and scholarships available to them. Leveraging AI-powered matching, the platform simplifies the discovery, documentation, and application process for financial assistance.

## 2. Target Audience
- **Citizens**: Individuals looking for government assistance (Education, Healthcare, Agriculture, etc.).
- **Families**: Users managing multiple members' eligibility under a single account.
- **Administrators**: Government or platform officials who review applications and manage the scheme index.

## 3. Functional Requirements

### 3.1 User Authentication & Profile
- **Mobile-first Auth**: Secure login via mobile number and password (integrated with Supabase).
- **Comprehensive Profile**: Collection of demographic data (State, Category, Gender, DOB) and socio-economic indicators (Income, Education, Occupation, Disability status).
- **Family Management**: Ability to add family members and manage their specific eligibility.
- **Bank Details**: Secure storage of bank account and IFSC details for direct benefit transfers (DBT).

### 3.2 Scheme Discovery
- **Smart Matching Engine**: Automatically match users to schemes based on their profile data (age, income, category, state).
- **Advanced Filtering**: Filter schemes by category (Education, Agriculture, etc.), type (Central, State), and benefits.
- **Search**: Full-text search for specific scheme names or keywords.
- **Scheme Details**: Comprehensive view of eligibility criteria, benefits, required documents, and application links.

### 3.3 Application Management
- **One-Click Application**: Pre-filling application forms using profile data.
- **Status Tracking**: Real-time tracking of application states (Draft, Submitted, Under Review, Approved, Rejected).
- **History**: Historical log of all past applications and their outcomes.

### 3.4 Document Management
- **Digital Vault**: Secure storage for essential documents (Aadhaar, Income Certificate, Caste Certificate).
- **OCR/AI Assistance**: (Future/Planned) AI-powered document verification and data extraction.
- **Status Verification**: Tracking whether a document has been verified by an admin.

### 3.5 Admin Portal
- **Dashboard Analytics**: Overview of registered users, pending applications, and system-wide stats.
- **User Management**: Search, filter, and modify user status.
- **Application Review**: Interface for admins to review submitted applications, view attached documents, and approve/reject with reasons.
- **System Settings**: Global configuration for the platform.

## 4. Non-Functional Requirements
- **Premium UI/UX**: High-end aesthetics using Glassmorphism and modern typography.
- **Responsiveness**: Seamless performance across Mobile, Tablet, and Desktop.
- **Security**: Strict Row Level Security (RLS) via Supabase; Aadhaar hashing for privacy.
- **Accessibility**: Multi-language support (initially English/Hindi) and WCAG compliance.
- **Scalability**: Architecture built to handle millions of eligible citizens.

## 5. Technology Stack
- **Framework**: Next.js 14 (App Router)
- **Database**: PostgreSQL (via Supabase & Prisma)
- **Authentication**: Supabase Auth
- **Styles**: Tailwind CSS + Radix UI
- **Deployment**: Vercel
