# 🏦 Loan Management System

> Production-style full-stack banking system simulating real-world loan processing workflows with role-based approvals, compliance tracking, and AI-assisted decision support.

**Built using real domain experience from working at Union Bank of India.**

---

## ⚡ TL;DR

- 5-role banking workflow (User → Checker → Maker → Authorizer → Auditor)
- AI-assisted fraud detection, loan advisory & compliance analysis
- Secure auth with JWT + OTP (Redis TTL)
- 8 loan products with eligibility calculation engine
- Built with Spring Boot + React + PostgreSQL + Redis
- Fully Dockerized and deployed (Railway + Vercel)

---

## 🚀 Live Demo

- Frontend: `https://loanmanagementsystem.up.railway.app`
- Backend API: `https://loanmanagementsystem-production-a1e8.up.railway.app`

---

## 🎯 Key Features

### 🔁 Real Banking Workflow
- Multi-stage loan approval system reflecting actual RBI-mandated banking hierarchy
- Role-based actions with strict state transitions (no skipping stages)
- End-to-end tracking from application → KYC → approval → disbursement
- Rejection reason mandatory at every stage — no silent rejections

### 🔐 Security & Access Control
- JWT-based stateless authentication
- Role-based authorization using Spring Security
- PII masking for auditor role (sees verification status, never raw Aadhaar/PAN)
- Duplicate check for email, Aadhaar and PAN at signup

### 🤖 AI Decision Support (LLM-based)
- **Fraud Detection** — flags income anomalies, document inconsistencies per application
- **Loan Advisor** — conversational AI that collects profile data and recommends best loan type
- **Compliance Analyzer** — validates TAT against RBI limits, checks eligibility vs sanctioned amount, flags incomplete rejection reasons
- Role-aware system prompts — each role gets a different AI context (user vs checker vs auditor)
- Designed as decision-support, not auto-approval

### 📊 Audit & Compliance
- Immutable audit trail stored without FK constraints (no cascade delete risk — regulatory requirement)
- Compliance flags per loan: ✅ Compliant / ⚠️ Warning / ❌ Non-Compliant
- TAT (Turnaround Time) tracking per stage against RBI processing guidelines
- Auditor can override AI flag and add written observations
- Search audit by username or loan type

---

## 👥 Role-Based Access

| Role | Responsibility |
|------|----------------|
| **User** | Apply for loans, track status, chat with AI advisor, simulate CIBIL score |
| **Checker** | First review of pending applications — forward or reject with reason |
| **Maker** | Approve or reject under-review applications |
| **Authorizer** | Final disbursement of approved loans |
| **Auditor** | Read-only compliance view — AI analysis, audit trail, add observations |

---

## 🏦 Loan Products (8 Types)

| Loan Type | Rate | Max Eligible | For |
|-----------|------|-------------|-----|
| Salary Loan | 10% | 60× monthly salary | Salaried employees |
| ITR Loan | 11% | 30× monthly income | Self-employed / Business |
| Pension Loan | 9.5% | 40× monthly pension | Retired pensioners |
| Agriculture Loan | 7% | 10× income | Against agricultural land |
| Housing Loan | 8.5% | 80× monthly income | Property purchase |
| Car Loan | 9% | 90% of vehicle price | Vehicle purchase |
| Bike Loan | 12% | 85% of vehicle price | Two-wheeler purchase |
| Gold Loan | 8% | 75% of gold value | Against gold ornaments |

---

## 🏗️ System Architecture

```
React (Vite)
     ↓
Spring Boot REST API
     ↓
PostgreSQL        Redis             Groq API
(Data Storage)    (OTP + Cache)     (AI Analysis)
```

---

## ⚙️ Engineering Highlights

- Designed workflow engine using role-based state transitions — each role can only act on loans in their assigned status
- Implemented JWT authentication filters with Spring Security — stateless, scalable auth
- Structured backend with Controller → Service → Repository layers for clean separation of concerns
- Avoided audit FK constraints to ensure regulatory data immutability — audit records survive loan deletion
- Role-aware AI routing — system prompt selected from backend based on JWT role, not frontend input
- Duplicate validation for PAN, Aadhaar and email on signup using real-time backend checks on field blur
- Containerized full stack using Docker + Docker Compose for consistent local and production environments

---

## 🧰 Tech Stack

### Backend
- Java 17, Spring Boot 4
- Spring Security + JWT
- JPA (Hibernate)
- PostgreSQL, Redis
- Groq API (LLaMA 3.1-8b-instant)

### Frontend
- React 18 (Vite)
- Axios
- Custom component library (no UI framework dependency)

### DevOps
- Docker, Docker Compose
- Railway (backend + database)
- Vercel (frontend)

---

## 🏃 Run Locally

```bash
git clone https://github.com/deepharshsri/LoanManagementSystem
cd LoanManagementSystem2

cp .env.example .env
# Add your GROQ_API_KEY in .env

docker-compose up --build
```

**Access:**
- Frontend: http://localhost:3000
- Backend: http://localhost:8080

### Test Credentials

| Role | Username | Password |
|------|----------|----------|
| User | Deepansh@gmail.com | Deepansh |
| Checker | Jitendra@gmail.com | Jitendra |
| Maker | Pratap@gmail.com | Pratap |
| Authorizer | Deepak@gmail.com | Deepak |
| Auditor | Admin@gmail.com | Admin |

---

## 🧠 Domain Insight

This system reflects how loan processing actually works in production banking environments — not a tutorial interpretation of it.

The checker-maker-authorizer hierarchy, TAT compliance, immutable audit trails, KYC gating, and PII protection are all features I understood before I wrote a single line of code — because I spent time working inside a bank where these processes ran every day.

That domain knowledge shaped every technical decision in this project.

---

## 🎯 Career Objective

Seeking an SDE1 Backend / Java Backend role where I can apply strong backend fundamentals and domain-driven system design to build scalable applications.

I transitioned from banking operations to software engineering — I bring both domain knowledge and technical depth to the table. I am self-taught, I build real things, and I learn fast.

---

## 📬 Contact

**Deepansh Srivastava**
📧 deepharshsri.98@gmail.com
💼 [LinkedIn](https://www.linkedin.com/in/deepanshsrivastava1)
🐙 [GitHub](https://github.com/deepharshsri)

---
