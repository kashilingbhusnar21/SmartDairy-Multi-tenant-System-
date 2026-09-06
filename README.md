# Smart Dairy ERP SaaS Platform with AI Advisory

A full-stack, SaaS-oriented dairy management system for dairy owners (admins) and farmers. It covers the operational lifecycle from farmer onboarding through milk collection, feed tracking, financial deductions, billing, payments, reporting, and AI-powered advisory chat.

---

## Project Description

**Smart Dairy** is a production-style Dairy ERP built with a Spring Boot REST backend and a React dashboard frontend. It supports multi-tenant dairy operations where each admin manages their own farmers, pricing, collections, and financials.

The platform delivers:

- End-to-end dairy operations: **farmer onboarding → milk collection → feed purchases → billing → payments → analytics**
- Dual portals with **JWT authentication** and **role-based access** (`ADMIN`, `FARMER`)
- Automated milk pricing (FAT/SNF), payment settlement with advance/loan/feed deductions, PDF/Excel exports
- **AI advisory chatbot** (Groq) for farmers (agriculture guidance) and admins (operations assistance)
- External integrations for **SMS (Twilio)** and **cloud PDF storage (Cloudinary)**

---

## Core Modules

### Admin Module

- Farmer management (create, update, activate/deactivate, password reset)
- Milk collection CRUD with FAT/SNF-based rate calculation
- Payment creation from collections, mark-as-paid settlement, receipts
- Feed purchase tracking with outstanding balances
- Financial ledger (advances, loans, other deductions)
- Farmer bill preview / export / finalize
- Dashboard analytics and advanced milk reports
- Dairy profile and milk pricing settings
- AI Assistant (admin operations advisory)

### Farmer Module

- Farmer login (dairy code + farmer ID + password)
- Personal dashboard
- Profile view
- Milk collection history
- Payments history (with receipt download)
- Feed purchase history and outstanding balance
- AI Assistant (farmer agricultural advisory, Hindi UI support)

### Authentication Module

- JWT-based login for Admin (`email` / `password`)
- JWT-based login for Farmer (`dairyCode` / `farmerId` / `password`)
- Admin registration and password reset flow
- Role-based API authorization (`ROLE_ADMIN`, `ROLE_FARMER`)
- Stateless Spring Security filter chain

### Feed Module

- Admin records feed purchases against farmers
- Outstanding feed amount tracked and deducted during payment settlement
- Feed purchases mirrored into the financial ledger (`pendingOther`)
- Farmer portal: view own purchases and outstanding balance

### AI Chatbot / Advisory Module

- Shared endpoint: `POST /api/ai-chat` (ADMIN & FARMER)
- Powered by **Groq** OpenAI-compatible Chat Completions API
- Role-specific system prompts:
  - **FARMER** — cattle health, nutrition, milk production, breeding, farm management
  - **ADMIN** — dairy operations and system guidance
- Optional language support (`en` / `hi`)
- Frontend chat UIs with optional Web Speech API (voice input/output)

---

## Architecture

```text
Frontend (React + Vite Dashboard)
        ↓  HTTPS / REST (Axios / fetch) + JWT Bearer token
Spring Boot Backend (REST Controllers)
        ↓
Service Layer (business logic, pricing, settlement, reports)
        ↓
Repository Layer (Spring Data JPA)
        ↓
Database (MySQL locally / PostgreSQL-ready for production)
```

### AI Chat Flow

```text
User (Admin / Farmer Chat UI)
        ↓  POST /api/ai-chat
AIChatController → AIChatService
        ↓  WebClient
Groq Chat Completions API
        ↓
Role-aware advisory response returned to UI
```

### Why this stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Backend | Spring Boot 3.3 | Scalable, production-ready REST APIs and security |
| Frontend | React + Vite | Dynamic role-based dashboards and forms |
| Database | MySQL (local) / PostgreSQL driver available | Structured relational domain data |
| Security | Spring Security + JWT (JJWT) | Stateless auth and RBAC |
| AI | Groq API via WebClient | Intelligent farmer/admin advisory |
| SMS | Twilio | Collection and payment notifications |
| Storage | Cloudinary | Payment receipt and farmer bill PDF hosting |
| Docs | springdoc OpenAPI | Interactive Swagger UI |

---

## External APIs & Integrations

| Integration | Purpose | Where used |
|-------------|---------|------------|
| **Groq AI** | Chat completions for advisory chatbot | `AIChatServiceImpl` → `{groq.api.url}/chat/completions` |
| **Twilio SMS** | Notify farmers on milk collection create and payment mark-paid | `SmsService`, also test endpoint `GET /send-sms` |
| **Cloudinary** | Upload/store PDF payment receipts and farmer bills | `CloudinaryService` (`smart-dairy/payment-receipts`, `smart-dairy/farmer-bills`) |
| **OpenPDF / Apache POI** | Generate PDF and Excel reports locally | Reports, receipts, statements, feed exports |

> Configure credentials via `application-*.properties` or environment variables. **Do not commit real API keys or secrets.**

---

## Tech Stack

### Frontend

- React.js 18
- Vite 5
- React Router 6
- Axios
- Tailwind CSS 3
- Recharts
- Lucide React
- react-hot-toast

### Backend

- Java 17
- Spring Boot 3.3.5
- Spring Web / Data JPA / Validation / Security / WebFlux
- REST APIs
- Lombok
- springdoc-openapi (Swagger UI)
- JJWT 0.12.6

### Database

- MySQL (local development)
- PostgreSQL driver included for production deployments

### Security

- JWT authentication (HS256)
- BCrypt password hashing
- Method-level `@PreAuthorize` role checks

### AI

- Groq OpenAI-compatible chat API
- Role-based system prompts (farmer agriculture / admin operations)

### Reporting & Media

- OpenPDF, Apache POI (Excel)
- Cloudinary (PDF storage)
- Twilio (SMS)

---

## How It Works (Step-by-Step)

1. **Admin registers / logs in** via `POST /api/auth/register` or `POST /api/auth/login` and receives a JWT.
2. **Admin configures dairy profile** and **milk pricing** (FAT/SNF rates, bonuses).
3. **Admin onboards farmers** (identity, bank details, credentials); farmers can be activated or deactivated.
4. **Admin records milk collections** (quantity, fat, SNF, shift). The system computes `ratePerLiter` and `totalAmount` from pricing settings and may send an SMS.
5. **Admin records feed purchases**; outstanding feed is tracked and posted to the financial ledger.
6. **Admin creates a payment from a milk collection** (`PENDING`). Outstanding feed can be deducted into the payment.
7. **Admin marks payment as PAID**. Settlement recovers pending advance / loan / other balances, updates the ledger, sends SMS, and can generate a Cloudinary-hosted PDF receipt.
8. **Admin can preview / export / finalize period farmer bills** (milk earnings minus deductions) as PDF/Excel.
9. **Farmer logs in** with dairy code, farmer ID, and password (`POST /api/farmer/auth/login`).
10. **Farmer views** personal dashboard, profile, milk history, payments, and feed purchases.
11. **Either role can open AI Chat** for advisory help (Groq-backed, role-specific prompts).

---

## Project Structure

```text
DAIRY360/
├── pom.xml                          # Maven backend (smart-dairy-backend)
├── src/main/java/com/smartdairy/
│   ├── SmartDairyApplication.java
│   ├── config/                      # Security, CORS, Cloudinary, WebClient, role seed
│   ├── controller/                  # REST API endpoints
│   ├── dto/                         # Request/response DTOs
│   ├── entity/                      # JPA entities
│   ├── exception/                   # Exception handling
│   ├── repository/                  # Spring Data JPA repositories
│   ├── security/                    # JWT filter, JwtService, UserDetails
│   ├── service/                     # Business interfaces
│   │   └── impl/                    # Service implementations
│   └── util/
├── src/main/resources/
│   ├── application.properties       # Active profile + Groq config
│   ├── application-local.properties # Local DB / JWT / Twilio / Cloudinary
│   └── application-prod.properties  # Env-var based production config
│
└── frontend/                        # React SPA (smart-dairy-frontend)
    ├── package.json
    ├── vite.config.js               # Dev server on port 5174
    ├── tailwind.config.js
    └── src/
        ├── App.jsx                  # Route map (admin + farmer portals)
        ├── components/              # Layouts, outlets, UI
        ├── pages/                   # Dashboard & feature pages
        ├── services/                # Axios API clients
        └── utils/auth.js            # Token/role localStorage helpers
```

### Domain entities (relationships)

| Entity | Role in domain |
|--------|----------------|
| `User` + `Role` | Admin accounts (`ADMIN` / seeded `FARMER` role names) |
| `Farmer` | Belongs to an admin; has login credentials |
| `DairyProfile` | One-to-one with admin user (dairy code, logo, metadata) |
| `PricingSettings` | Per-admin milk rate configuration |
| `MilkCollection` | Daily collection linked to farmer + admin |
| `Payment` | One-to-one with milk collection (`PENDING` / `PAID`) |
| `FeedPurchase` | Feed sales; may settle against a payment |
| `FarmerBill` | Period bill with deductions and optional PDF URL |
| `FarmerFinancialAccount` | Pending advance / loan / other balances |
| `FarmerFinancialTransaction` | Ledger audit trail |

---

## Setup Instructions

### Prerequisites

- Java 17+
- Maven 3.9+ (or use `./mvnw`)
- Node.js 18+ and npm
- MySQL 8+ (local)

### Backend

1. Create a MySQL database (or rely on `createDatabaseIfNotExist=true` in the local JDBC URL).
2. Configure `src/main/resources/application-local.properties`:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/smart_dairy?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
spring.datasource.username=YOUR_DB_USER
spring.datasource.password=YOUR_DB_PASSWORD

app.jwt.secret=YOUR_BASE64_OR_LONG_SECRET
app.jwt.expiration-ms=86400000

twilio.account.sid=YOUR_TWILIO_SID
twilio.auth.token=YOUR_TWILIO_TOKEN
twilio.phone.number=YOUR_TWILIO_NUMBER

cloudinary.cloud-name=YOUR_CLOUD_NAME
cloudinary.api-key=YOUR_API_KEY
cloudinary.api-secret=YOUR_API_SECRET

server.port=8080
```

3. Configure Groq in `src/main/resources/application.properties` (or move to env vars):

```properties
spring.profiles.active=local
groq.api.key=YOUR_GROQ_API_KEY
groq.api.url=https://api.groq.com/openai/v1
groq.model=YOUR_GROQ_MODEL
```

4. For production, set `spring.profiles.active=prod` and provide env vars listed in `application-prod.properties` (`SPRING_DATASOURCE_*`, `JWT_SECRET`, `TWILIO_*`, `CLOUDINARY_*`).

### Frontend

```bash
cd frontend
npm install
```

Optional: set API base URL (defaults to `http://localhost:8080/api`):

```bash
# .env
VITE_API_BASE_URL=http://localhost:8080/api
```

---

## Run Project

### Backend

```bash
./mvnw spring-boot:run
```

- API: [http://localhost:8080](http://localhost:8080)
- Swagger UI: [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)

### Frontend

```bash
cd frontend
npm run dev
```

- App: [http://localhost:5174](http://localhost:5174)

### Production frontend build

```bash
cd frontend
npm run build
npm run preview
```

---

## API Endpoints

Base path prefix: `/api` (except `GET /send-sms` and root health).

### Auth (public)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Admin registration |
| POST | `/api/auth/login` | Admin login |
| POST | `/api/auth/forgot-password` | Start password reset |
| POST | `/api/auth/verify-reset-token` | Verify reset token |
| POST | `/api/auth/reset-password` | Reset password |
| POST | `/api/farmer/auth/login` | Farmer login |

### Farmer portal (role: `FARMER`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/farmer/profile` | Own profile |
| GET | `/api/farmer/milk-collections` | Own milk collections |
| GET | `/api/farmer/milk-collections/{id}` | Own collection by id |
| GET | `/api/farmer/payments` | Own payments |
| GET | `/api/farmer/payments/{id}` | Own payment |
| GET | `/api/farmer/payments/{id}/receipt` | Own receipt PDF |
| GET | `/api/farmer/feed-purchases` | Own feed purchases |
| GET | `/api/farmer/feed-purchases/outstanding` | Outstanding feed balance |

### Admin — Farmers

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/farmers` | Create farmer |
| PUT | `/api/farmers/{id}` | Update farmer |
| DELETE | `/api/farmers/{id}` | Delete farmer |
| PATCH | `/api/farmers/{id}/activate` | Activate |
| PATCH | `/api/farmers/{id}/deactivate` | Deactivate |
| GET | `/api/farmers` | List / search (`?q=`) |
| GET | `/api/farmers/inactive` | Inactive farmers |
| GET | `/api/farmers/{id}` | Get farmer |
| GET | `/api/farmers/lookup/by-id/{id}` | Lookup |
| POST | `/api/farmers/{id}/reset-password` | Reset farmer password |

### Admin — Milk collections

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/milk-collections` | Create |
| PUT | `/api/milk-collections/{id}` | Update |
| DELETE | `/api/milk-collections/{id}` | Delete |
| GET | `/api/milk-collections?date=` | Daily list |
| GET | `/api/milk-collections/{id}` | Get one |
| GET | `/api/milk-collections/farmer/{farmerId}` | By farmer |
| GET | `/api/milk-collections/stats/daily` | Daily stats |

### Admin — Payments

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payments/from-collection/{milkCollectionId}` | Create pending payment |
| PUT | `/api/payments/{id}/mark-paid` | Settle payment |
| GET | `/api/payments` | List (`?status=`) |
| GET | `/api/payments/pending` | Pending payments |
| GET | `/api/payments/farmer/{farmerId}` | By farmer |
| GET | `/api/payments/{id}` | Get one |
| GET | `/api/payments/{id}/receipt` | Receipt PDF |
| GET | `/api/payments/stats/dashboard` | Dashboard stats |
| GET | `/api/payments/summary/weekly` | Weekly summary |
| GET | `/api/payments/summary/monthly` | Monthly summary |

### Admin — Feed purchases

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/feed-purchases` | Create |
| GET | `/api/feed-purchases` | List (filters) |
| GET | `/api/feed-purchases/summary` | Summary |
| GET | `/api/feed-purchases/chart` | Chart data |
| GET | `/api/feed-purchases/export` | PDF/Excel export |

### Admin — Reports & bills

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reports/milk/daily` | Daily milk export |
| GET | `/api/reports/milk/weekly` | Weekly milk export |
| GET | `/api/reports/milk/monthly` | Monthly milk export |
| GET | `/api/reports/milk/farmer` | Per-farmer milk export |
| GET | `/api/reports/milk/advanced/summary` | Advanced summary JSON |
| GET | `/api/reports/milk/advanced/export` | Advanced PDF/XLSX |
| GET | `/api/reports/milk/farmer-bill/preview` | Bill preview |
| GET | `/api/reports/milk/farmer-bill/export` | Bill PDF/XLSX |
| GET | `/api/reports/milk/farmer-bill/finalize` | Finalize bill + recover deductions |

### Admin — Financial ledger

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/financial-ledger/account/{farmerId}` | Account balances |
| GET | `/api/financial-ledger/transactions/{farmerId}` | Transactions |
| POST | `/api/financial-ledger/advance/add` | Add advance |
| POST | `/api/financial-ledger/advance/recover` | Recover advance |
| POST | `/api/financial-ledger/loan/add` | Add loan |
| POST | `/api/financial-ledger/loan/recover` | Recover loan |
| POST | `/api/financial-ledger/other/add` | Add other deduction |
| POST | `/api/financial-ledger/other/recover` | Recover other |
| GET | `/api/financial-ledger/analytics` | Analytics |
| GET | `/api/financial-ledger/analytics/farmer/{farmerId}` | Farmer analytics |
| GET | `/api/financial-ledger/analytics/filter` | Filtered analytics |
| GET | `/api/financial-ledger/statement/{farmerId}` | Statement JSON |
| GET | `/api/financial-ledger/statement/pdf/{farmerId}` | Statement PDF |
| GET | `/api/financial-ledger/statement/excel/{farmerId}` | Statement Excel |

### Dashboard, pricing, dairy profile, AI

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| GET | `/api/dashboard/overview` | ADMIN | Ops overview |
| GET | `/api/pricing-settings` | ADMIN, FARMER | Current pricing |
| PUT | `/api/pricing-settings` | ADMIN | Update pricing |
| GET | `/api/pricing-settings/calculate` | ADMIN, FARMER | Preview rate/total |
| GET | `/api/dairy-profile/me` | ADMIN, FARMER | Dairy profile |
| PUT | `/api/dairy-profile/me` | ADMIN | Upsert dairy profile |
| POST | `/api/ai-chat` | ADMIN, FARMER | AI advisory chat |

### Misc

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/home/public` | Public | Public home content |
| GET | `/api/home/private` | Authenticated | Private greeting |
| GET | `/api/secure/admin` | ADMIN | Auth smoke test |
| GET | `/api/secure/farmer` | FARMER, ADMIN | Auth smoke test |
| GET | `/send-sms` | Public | Twilio SMS test |

---

## Security Features

- **JWT authentication** for both Admin and Farmer sessions (stateless)
- **Role-based authorization** via Spring Security `@PreAuthorize` (`ROLE_ADMIN`, `ROLE_FARMER`)
- **BCrypt** password encoding
- **Protected frontend routes** (`ProtectedOutlet`, `AdminOutlet`, `FarmerOutlet`)
- **Axios interceptor** attaches `Authorization: Bearer <token>`; redirects to login on `401`
- Farmer JWT includes claims (`farmerId`, `adminId`, `role=FARMER`) for scoped data access
- Swagger UI paths are public for API exploration; all other APIs require authentication unless listed as public

---

## Screenshots

> Add dashboard screenshots here

Suggested captures:

- Admin dashboard overview
- Milk collection list / form
- Payment dashboard
- Farmer portal dashboard
- AI chat (Admin & Farmer)

---

## Future Improvements

- AI-based feed quality / cattle health image analyzer
- IoT milk analyzer device integration
- Native mobile app for field collection
- Deeper multi-tenant SaaS billing and subscription plans
- Advanced analytics and forecasting
- Cloud deployment hardening (AWS / container orchestration)
- Move all secrets fully to environment variables / secret managers
- Conversation memory / RAG for AI advisory over dairy data

---

## Key Learnings

- Full-stack SaaS product development with clear Admin/Farmer domain separation
- Role-based system design with dual JWT auth flows
- Layered REST API architecture (controller → service → repository → entity)
- Real-world dairy domain: pricing, deductions, settlement, billing, and reporting
- Integrating AI advisory (Groq), SMS (Twilio), and cloud document storage (Cloudinary)

---

## Resume Description

Developed a full-stack SaaS Dairy ERP platform with AI advisory using Spring Boot and React, featuring JWT role-based access (Admin/Farmer), milk collection-to-payment settlement with financial ledger deductions, feed tracking, PDF/Excel reporting, Twilio SMS, Cloudinary storage, and Groq-powered chatbot assistance.

Built production-style multi-tenant dairy operations software covering farmer onboarding, FAT/SNF pricing, billing workflows, analytics dashboards, and intelligent agricultural/admin advisory chat.

---

## License

Private project — update this section if you publish under an open-source license.
