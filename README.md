# DairyAI — Production-Grade Multi-Tenant Dairy SaaS Platform with AI Advisory & IoT Telemetry

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()
[![Tests](https://img.shields.io/badge/tests-85%2F85%20passing-success.svg)]()
[![Java](https://img.shields.io/badge/Java-17%20%7C%2021-orange.svg)]()
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3.5-brightgreen.svg)]()
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-ACID%20Ledger-blue.svg)]()
[![Redis](https://img.shields.io/badge/Redis-RateLimiter%20%26%20Cache-red.svg)]()
[![AWS EC2](https://img.shields.io/badge/AWS-EC2%20Deployed-orange.svg)]()
[![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions%20with%20Auto--Rollback-blueviolet.svg)]()

DairyAI is an enterprise-grade, multi-tenant SaaS dairy enterprise management and operations platform engineered for commercial dairy cooperatives and independent farmers. It manages the entire operational lifecycle: **IoT M2M milk telemetry ingestion, FAT/SNF automated pricing, feed tracking, double-entry financial ledger recovery, multi-tenant billing, Twilio notifications, Cloudinary PDF generation, and Groq LLM-powered advisory chat.**

The platform is hardened for production with **85+ automated unit and integration tests**, **Nginx reverse proxy security**, **Redis-based rate limiting**, and an **automated CI/CD deployment pipeline with health-check-driven rollback**.

---

## 🏛️ System Architecture

```text
                                  ┌────────────────────────┐
                                  │   Clients & Devices    │
                                  └───────────┬────────────┘
                                              │ HTTPS / WSS
                                              ▼
                        ┌──────────────────────────────────────────┐
                        │      Nginx Reverse Proxy & Gateway       │
                        │   SSL Termination | Rate-Limiter | WAF   │
                        │     Path Protection (/actuator internal) │
                        └─────────────────────┬────────────────────┘
                                              │
                     ┌────────────────────────┴────────────────────────┐
                     │                                                 │
                     ▼                                                 ▼
        ┌─────────────────────────┐                       ┌─────────────────────────┐
        │   Admin Portal (React)  │                       │  Farmer Portal (React)  │
        │    Vite, Tailwind CSS   │                       │   Mobile-Responsive UI  │
        └────────────┬────────────┘                       └────────────┬────────────┘
                     │                                                 │
                     └────────────────────────┬────────────────────────┘
                                              │ Bearer JWT (Tenant Claims)
                                              ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                           Spring Boot 3.3 Application Core                              │
│                                                                                         │
│  ┌────────────────────────┐  ┌────────────────────────┐  ┌───────────────────────────┐  │
│  │ JwtAuthenticationFilter│  │  TenantContext Filter  │  │  Method Security (RBAC)   │  │
│  └────────────────────────┘  └────────────────────────┘  └───────────────────────────┘  │
│                                                                                         │
│  ┌───────────────────────────────────────────────────────────────────────────────────┐  │
│  │                              Microservice / Core Modules                          │  │
│  │  • Multi-Tenant Isolation Engine         • Double-Entry Financial Recovery Ledger │  │
│  │  • IoT Telemetry Ingestion (M2M Auth)    • Milk Collection & FAT/SNF Pricing      │  │
│  │  • Feed Inventory & Billing Engine       • AI Advisory Engine (Groq Llama 3.3)    │  │
│  └───────────────────────────────────────────────────────────────────────────────────┘  │
│                                              │                                          │
│         ┌────────────────────────────────────┼────────────────────────────────────┐     │
│         ▼                                    ▼                                    ▼     │
│  ┌──────────────┐                     ┌──────────────┐                     ┌──────────┐ │
│  │  PostgreSQL  │                     │ Redis Engine │                     │ Cloud    │ │
│  │  ACID Ledger │                     │ Rate-Limit & │                     │ Services │ │
│  │  Tenant Data │                     │ Cache Store  │                     │ Twilio / │ │
│  │  JPA/Hibernate│                    │ Token Bucket │                     │ Cloudin. │ │
│  └──────────────┘                     └──────────────┘                     └──────────┘ │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Key Highlights & Production Features

### 1. Multi-Tenant Architecture & Data Isolation
- **Row-Level Tenant Isolation:** Every request is authenticated via stateless JWT containing encrypted `tenant_id` (admin ID) and user roles.
- **Tenant Context Security:** All database queries across `Farmer`, `MilkCollection`, `FeedPurchase`, and `FarmerBill` are strictly scoped to the tenant. Cross-tenant reads or writes return immediate `403 Forbidden` responses.
- **Dedicated Tenant Credentials:** Admins create isolated credentials; farmers authenticate via composite keys (`dairyCode` + `farmerId` + `password`).

### 2. High-Throughput IoT M2M Telemetry Ingestion
- **Automated Collection:** Dedicated endpoint (`POST /api/iot/telemetry/collect`) designed for direct milk analyzer hardware and digital weighing scale machines.
- **Machine-to-Machine (M2M) Security:** Authenticated using pre-shared encrypted device tokens (`X-Device-Token`) and tenant headers.
- **Idempotency & Hardware Fault Tolerance:** Redis-backed request deduplication prevents duplicate collection records if hardware retries after network hiccups.

### 3. Double-Entry Financial Ledger with Defensive Precision
- **Accurate Decimal Arithmetic:** All monetary and milk volume calculations use `BigDecimal` with explicit scale and rounding modes (`RoundingMode.HALF_UP`) to prevent floating-point discrepancies.
- **Automated Settlement & Recovery:** Automatically calculates net payouts during payment settlement by deducting pending feed purchases, cash advances, and equipment loans.
- **Auditable Transaction Log:** Every credit and debit generates an immutable record in `FarmerFinancialTransaction` with running balance tracking.

### 4. AI Advisory Assistant (Groq LLM Integration)
- **Role-Aware Context Prompts:**
  - **Farmer Mode:** Agricultural advisory covering cattle nutrition, lactation cycles, disease prevention, and veterinary advice with multilingual support (`en` / `hi`).
  - **Admin Mode:** Operational intelligence for herd optimization, inventory management, and yield forecasting.
- **Resilient WebClient Pipeline:** Implemented via asynchronous non-blocking Spring WebClient with circuit-breaking fallbacks if external AI APIs experience latency.

### 5. Automated CI/CD with Zero-Downtime Health-Check Rollback
- **GitHub Actions Pipeline:** Triggered on every push to `master`. Runs full Maven compilation and executes the **85-test unit & integration test gate**.
- **Automated Rollback Engine:** Before deploying, creates an archive of `~/backups/app-old.jar`. Once the new release starts, polls `/actuator/health`. If the health check fails or times out within 60 seconds, the deployment automatically aborts, restores the previous verified JAR, and alerts the team.

### 6. Nginx Reverse Proxy & Perimeter Defense
- **SSL Termination & HTTPS Enforcement:** Modern TLS 1.3 encryption.
- **Rate Limiting:** Protects `/api/auth/*` endpoints against brute-force attacks via Redis and Nginx leaky-bucket zones.
- **Internal Actuator Hardening:** `/actuator/**` metric endpoints are blocked from public internet exposure and accessible only to local VPC monitoring agents.

---

## 🛠️ Complete Technology Stack

| Layer | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Backend Core** | Java | 17 / 21 | Modern LTS Java runtime with virtual-thread capability |
| **Framework** | Spring Boot | 3.3.5 | Production REST API core, Security, Data JPA |
| **Database** | PostgreSQL / MySQL | 15+ / 8.0+ | ACID transactions, financial ledgers, relational domain data |
| **Caching & Rate Limiting** | Redis | 7.0+ | Distributed cache, API rate limiting, IoT idempotency |
| **Security** | Spring Security + JJWT | 0.12.6 | Stateless JWT authentication, RBAC (`ADMIN`, `FARMER`) |
| **AI Advisory** | Groq Llama 3.3 / WebClient | - | Role-based context advisory chatbot |
| **DevOps & Cloud** | AWS EC2 & Docker | - | Cloud hosting, containerized sandbox dependencies |
| **CI/CD** | GitHub Actions | - | Automated build, 85-test gate, and auto-rollback deployment |
| **Reverse Proxy** | Nginx | 1.24+ | SSL termination, WAF rate-limiting, internal endpoint protection |
| **Third-Party Services**| Twilio & Cloudinary | - | SMS dispatch notifications & cloud PDF invoice storage |
| **Testing** | JUnit 5, Mockito, MockMvc | - | 85 automated unit, isolation, and integration tests |
| **Load Testing** | Apache JMeter | 5.6+ | Performance and concurrency stress testing |
| **Frontend** | React 18 + Vite | - | Admin & Farmer role-based responsive dashboards |

---

## 📊 Database Schema & Domain Model

```text
┌──────────────┐         1:1          ┌────────────────┐
│     User     ├──────────────────────┤  DairyProfile  │
│  (ROLE_ADMIN)│                      │  (Dairy Code)  │
└──────┬───────┘                      └────────────────┘
       │ 1:N
       ▼
┌──────────────┐         1:N          ┌──────────────────────────┐
│    Farmer    ├──────────────────────┤      MilkCollection      │
│  (Credentials│                      │  (Fat, SNF, Liters, Rate)│
└──────┬───────┘                      └────────────┬─────────────┘
       │                                           │ 1:1
       │ 1:1                                       ▼
       ├──────────────────────────────┐       ┌──────────────────────────┐
       │                              │       │         Payment          │
       ▼                              │       │  (Gross, Deductions, Net)│
┌──────────────────────────────┐      │       └──────────────────────────┘
│    FarmerFinancialAccount    │      │
│  (Pending Advances & Loans)  │      │ 1:N
└──────────────┬───────────────┘      ▼
               │ 1:N          ┌──────────────────────────┐
               ▼              │       FeedPurchase       │
┌──────────────────────────────┐  │  (Feed items, Quantity)  │
│  FarmerFinancialTransaction  │  └──────────────────────────┘
│  (Immutable Audit Ledger)    │
└──────────────────────────────┘
```

---

## 🧪 Testing & Quality Assurance

DairyAI enforces zero-defect production deployments with **85 fully passing automated tests**:

```bash
# Execute complete unit and integration test suite
./mvnw clean test
```

### Verified Test Suite Breakdown:
- **Tenant Isolation Tests (`AdminTenantIsolationTest`):** Verifies that Admin A cannot view, mutate, or access milk records or financial ledgers belonging to Admin B.
- **Operational Record Constraints (`OperationalRecordDateValidatorTest`):** Prevents back-dated milk collections and fraudulent rate manipulation.
- **Financial Math Tests (`FinancialMathTest`):** Validates penny-accurate deductions, zero floating-point errors, and proper `BigDecimal` rounding.
- **Batch Processing & Settlement (`PaymentServiceImplBatchTest`):** Verifies ledger transactions, feed deductions, and loan recovery under bulk payments.
- **IoT Controller Tests (`IoTTelemetryControllerTest`):** Validates hardware token authentication and payload schema validation.

```text
[INFO] Results:
[INFO] 
[INFO] Tests run: 85, Failures: 0, Errors: 0, Skipped: 0
[INFO] 
[INFO] BUILD SUCCESS
```

---

## ⚙️ Quick Start & Local Setup

### 1. Prerequisites
- **Java 17 or 21** (`java -version`)
- **Maven 3.9+** (or use `./mvnw`)
- **PostgreSQL 15+** or **MySQL 8.0+**
- **Redis Server** (optional for local mock; required for rate-limiting)
- **Node.js 18+** & npm

### 2. Backend Configuration
Clone the repository and configure `src/main/resources/application-local.properties`:

```properties
# Database Configuration
spring.datasource.url=jdbc:mysql://localhost:3306/smart_dairy?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
spring.datasource.username=root
spring.datasource.password=root

# Security
app.jwt.secret=your_super_secret_jwt_key_that_is_at_least_256_bits_long
app.jwt.expiration-ms=86400000

# Redis Cache & Rate-Limiter
spring.data.redis.host=localhost
spring.data.redis.port=6379

# Third-Party Integrations
twilio.account.sid=your_twilio_sid
twilio.auth.token=your_twilio_token
twilio.phone.number=your_twilio_number

cloudinary.cloud-name=your_cloud_name
cloudinary.api-key=your_api_key
cloudinary.api-secret=your_api_secret

# AI Advisory
groq.api.key=your_groq_api_key
groq.model=llama-3.3-70b-versatile
```

### 3. Run Application
```bash
# Run Spring Boot backend
./mvnw spring-boot:run

# In a separate terminal, start frontend
cd frontend
npm install
npm run dev
```

- **Backend API:** `http://localhost:8080/api`
- **Interactive Swagger UI:** `http://localhost:8080/swagger-ui.html`
- **Frontend Dashboard:** `http://localhost:5174`

---

## 🚢 Production Deployment Architecture

```bash
# Production Build
./mvnw clean package -DskipTests=false
```

DairyAI is deployed using a production-hardened topology:
1. **AWS EC2 (Ubuntu 22.04 LTS):** Hosts the Spring Boot application managed by `systemd`.
2. **Managed PostgreSQL / Amazon RDS:** Dedicated multi-AZ transactional database.
3. **Nginx:** Handles SSL termination (`certbot` Let's Encrypt), HTTP/2, and routes traffic to `http://127.0.0.1:8080`.
4. **CI/CD Deployment Script (`deploy.yml`):** Automatically tests, backs up running jar, deploys new artifact, and tests `/actuator/health` with automated fallback.

---

## 📌 API Endpoints Overview

| Module | Method | Endpoint | Access | Purpose |
| :--- | :---: | :--- | :---: | :--- |
| **Auth** | `POST` | `/api/auth/login` | Public | Admin JWT Authentication |
| **Auth** | `POST` | `/api/farmer/auth/login` | Public | Farmer Multi-factor Authentication |
| **IoT Telemetry** | `POST` | `/api/iot/telemetry/collect` | Machine | Ingest raw milk fat/SNF data directly from hardware |
| **Milk Operations** | `POST` | `/api/milk-collections` | Admin | Record manual milk collection with automated pricing |
| **Ledger** | `POST` | `/api/financial-ledger/advance/add` | Admin | Credit cash advance to farmer ledger |
| **Billing** | `POST` | `/api/payments/from-collection/{id}` | Admin | Create payable invoice with deduction preview |
| **Settlement** | `PUT` | `/api/payments/{id}/mark-paid` | Admin | Execute ledger settlement & generate Cloudinary PDF |
| **AI Advisory** | `POST` | `/api/ai-chat` | Admin/Farmer | Role-aware Llama 3.3 agricultural & business advisory |
| **Health** | `GET` | `/actuator/health` | Internal | Application runtime health check |

---

## 📄 License

This software is developed and maintained as a proprietary enterprise solution. All rights reserved.
