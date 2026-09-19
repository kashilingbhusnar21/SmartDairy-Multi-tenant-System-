# Feed Purchase Module - Complete System Flow Documentation

## Overview
This document explains the end-to-end flow of the Feed Purchase module in the Smart Dairy Multi-tenant System, covering frontend, API, controller, service, database, and financial logic layers.

---

## 1. FRONTEND FLOW

### User Form Submission Process

**Location:** `frontend/src/pages/FeedPurchasesPage.jsx`

#### Form Structure
The form collects:
- Farmer selection (via FarmerSelect component)
- Feed date (date picker with operational date window validation)
- Feed Type (dropdown with predefined options + OTHER)
- Company Name (dropdown with predefined options + OTHER)
- Quantity (numeric input)
- Rate per unit (numeric input)
- Notes (optional text input)

#### Key Methods

**handleSubmit() / submit()**
```javascript
const submit = async (e) => {
  e.preventDefault();
  
  // Step 1: Validation for OTHER custom inputs
  if (form.feedType === 'OTHER' && (!form.customFeedType || form.customFeedType.trim() === '')) {
    toast.error('Please enter a custom feed type');
    return;
  }
  if (form.feedCompanyName === 'OTHER' && (!form.customCompanyName || form.customCompanyName.trim() === '')) {
    toast.error('Please enter a custom company name');
    return;
  }
  
  // Step 2: Payload formation
  const payload = {
    farmerId: Number(form.farmerId),
    feedDate: form.feedDate,
    feedType: form.feedType === 'OTHER' ? form.customFeedType.toUpperCase().trim() : form.feedType,
    feedCompanyName: form.feedCompanyName === 'OTHER' ? form.customCompanyName.toUpperCase().trim() : form.feedCompanyName,
    feedQuantity: Number(form.feedQuantity),
    unitType: form.unitType,
    ratePerUnit: Number(form.ratePerUnit),
    notes: form.notes || undefined,
  };
  
  // Step 3: API call
  const created = await createFeedPurchase(payload);
  toast.success(created.smsNotification || "Feed purchase saved");
  
  // Step 4: Reset form and reload data
  setForm((p) => ({ ...p, feedCompanyName: "", feedQuantity: "1", ratePerUnit: "0", notes: "", customFeedType: "", customCompanyName: "" }));
  load();
};
```

#### Dropdown Value Conversion
- Predefined values: Sent as uppercase enum values (e.g., `CATTLE_FEED`, `AMUL`)
- Custom values (OTHER): User input converted to uppercase before sending
- Example: User selects "Cattle Feed" → sends `CATTLE_FEED`
- Example: User enters "custom feed" in OTHER field → sends `CUSTOM FEED`

#### API Call Structure
```javascript
// Location: frontend/src/services/feedPurchases.js
export function createFeedPurchase(payload) {
  return api.post("/feed-purchases", payload).then((res) => res.data);
}
```

**Headers:** Automatically added by axios interceptor
- `Authorization: Bearer <JWT_TOKEN>`
- `Content-Type: application/json`

---

## 2. API LAYER

### Endpoint Details

**POST** `/api/feed-purchases`

**Request Payload:**
```json
{
  "farmerId": 123,
  "feedDate": "2026-09-10",
  "feedType": "CATTLE_FEED",
  "feedCompanyName": "AMUL",
  "feedQuantity": 100.00,
  "unitType": "KG",
  "ratePerUnit": 25.50,
  "notes": "Monthly purchase"
}
```

**Authentication:**
- JWT token extracted from localStorage
- Token sent in `Authorization: Bearer <token>` header
- Spring Security validates token and extracts user context

---

## 3. CONTROLLER FLOW (Spring Boot)

**Location:** `src/main/java/com/smartdairy/controller/FeedPurchaseController.java`

### Controller Method

```java
@PostMapping
@PreAuthorize("hasRole('ADMIN')")
public ResponseEntity<FeedPurchaseResponse> create(@Valid @RequestBody FeedPurchaseRequest request) {
    return ResponseEntity.ok(feedPurchaseService.create(request));
}
```

#### Flow Breakdown:
1. **Security Check:** `@PreAuthorize("hasRole('ADMIN')")` ensures only admins can create feed purchases
2. **Validation:** `@Valid` triggers JSR-303 validation on FeedPurchaseRequest DTO
3. **DTO Binding:** Request JSON automatically mapped to FeedPurchaseRequest object
4. **Service Delegation:** Request passed to `feedPurchaseService.create()`
5. **Response:** Returns FeedPurchaseResponse wrapped in ResponseEntity

---

## 4. SERVICE LAYER (CORE LOGIC)

**Location:** `src/main/java/com/smartdairy/service/impl/FeedPurchaseServiceImpl.java`

### Important Logic in create() Method

#### Step 1: Operational Date Validation
```java
operationalRecordDateValidator.validateCreateDate(request.getFeedDate());
```
- Ensures feed date is within allowed operational window
- Prevents future/backdated entries beyond configured limits

#### Step 2: User & Farmer Lookup
```java
User admin = userService.getLoggedInUser();
Farmer farmer = farmerRepository.findByIdAndAdmin(request.getFarmerId(), admin)
    .orElseThrow(() -> new ResourceNotFoundException("Farmer not found"));
```
- Extracts admin from JWT context
- Validates farmer belongs to the admin's tenant (multi-tenant isolation)

#### Step 3: Normalization & Validation
```java
// Normalize and validate feed type
String normalizedFeedType = request.getFeedType().trim().toUpperCase();
if (FeedType.isValid(normalizedFeedType)) {
    normalizedFeedType = FeedType.valueOf(normalizedFeedType).name();
}
// If not a valid enum, accept it as custom value (already uppercased)

// Normalize and validate company name
String normalizedCompanyName = request.getFeedCompanyName().trim().toUpperCase();
if (CompanyName.isValid(normalizedCompanyName)) {
    normalizedCompanyName = CompanyName.valueOf(normalizedCompanyName).name();
}
```

**Key Points:**
- All values converted to uppercase for consistency
- If value matches predefined enum, uses enum name
- If value doesn't match (custom OTHER), accepts as-is (already uppercased)
- This prevents case mismatches like "amul" vs "AMUL" vs "Amul"

#### Step 4: Total Calculation
```java
BigDecimal total = request.getFeedQuantity()
    .multiply(request.getRatePerUnit())
    .setScale(2, RoundingMode.HALF_UP);
```
- `totalAmount = feedQuantity × ratePerUnit`
- Rounded to 2 decimal places for currency precision

#### Step 5: Entity Mapping
```java
FeedPurchase f = FeedPurchase.builder()
    .admin(admin)
    .farmer(farmer)
    .feedDate(request.getFeedDate())
    .feedType(normalizedFeedType)
    .feedCompanyName(normalizedCompanyName)
    .feedQuantity(request.getFeedQuantity().setScale(2, RoundingMode.HALF_UP))
    .unitType(request.getUnitType().trim())
    .ratePerUnit(request.getRatePerUnit().setScale(2, RoundingMode.HALF_UP))
    .totalAmount(total)
    .remainingAmount(total)
    .notes(request.getNotes())
    .build();
```

---

## 5. FINANCIAL LOGIC (VERY IMPORTANT)

### Total Amount Calculation
```
totalAmount = feedQuantity × ratePerUnit
```

**Example:**
- Quantity: 100 KG
- Rate: ₹25.50 per KG
- Total: ₹2,550.00

### Financial Account Impact

#### Step 1: Get or Create Farmer Financial Account
```java
FarmerFinancialAccount financialAccount = financialAccountRepository
    .findByAdminAndFarmer(admin, farmer)
    .orElseGet(() -> {
        // Create new account if doesn't exist
        FarmerFinancialAccount account = FarmerFinancialAccount.builder()
            .admin(admin)
            .farmer(farmer)
            .pendingAdvance(BigDecimal.ZERO)
            .pendingLoan(BigDecimal.ZERO)
            .pendingOther(BigDecimal.ZERO)
            .build();
        return financialAccountRepository.save(account);
    });
```

#### Step 2: Update Outstanding Balance
```java
BigDecimal balanceBefore = financialAccount.getPendingOther();
BigDecimal newBalance = balanceBefore.add(total).setScale(2, RoundingMode.HALF_UP);
financialAccount.setPendingOther(newBalance);
financialAccountRepository.save(financialAccount);
```

**Logic:**
- Feed purchases are tracked under `pendingOther` category
- This represents money the farmer owes for feed purchases
- Balance increases with each feed purchase

#### Step 3: Create Financial Transaction Entry
```java
FarmerFinancialTransaction transaction = FarmerFinancialTransaction.builder()
    .account(financialAccount)
    .farmer(farmer)
    .admin(admin)
    .transactionType(FarmerFinancialTransaction.FinancialTransactionType.FEED_PURCHASE_ADDED)
    .amount(total)
    .balanceBefore(balanceBefore)
    .balanceAfter(newBalance)
    .description("Feed purchase: " + f.getFeedType() + " - " + f.getFeedCompanyName())
    .referenceType(FarmerFinancialTransaction.ReferenceType.SYSTEM)
    .referenceId("FEED-" + f.getId())
    .build();
financialTransactionRepository.save(transaction);
```

**Ledger Entry Purpose:**
- Maintains audit trail of all financial transactions
- Tracks balance changes over time
- Links transaction to specific feed purchase via referenceId
- Enables reconciliation and reporting

### Payment Deduction Logic

When farmer makes a payment, system automatically deducts outstanding feed amounts:

```java
public BigDecimal applyOutstandingDeductionForPayment(Long farmerId, BigDecimal availableAmount, Long paymentId) {
    // Fetch outstanding feed purchases
    List<FeedPurchase> outstanding = feedPurchaseRepository.findOutstandingByAdminAndFarmer(admin, farmerId);
    
    // Deduct from oldest outstanding first
    for (FeedPurchase f : outstanding) {
        BigDecimal canSettle = f.getRemainingAmount().min(remainingForDeduction);
        f.setRemainingAmount(f.getRemainingAmount().subtract(canSettle));
        if (f.getRemainingAmount().compareTo(BigDecimal.ZERO) == 0) {
            f.setSettledInPayment(payment);
        }
        feedPurchaseRepository.save(f);
        remainingForDeduction = remainingForDeduction.subtract(canSettle);
        deducted = deducted.add(canSettle);
    }
    return deducted;
}
```

**Logic:**
- Payments automatically applied to outstanding feed purchases
- Oldest outstanding purchases settled first (FIFO)
- When fully paid, `remainingAmount` becomes 0
- Payment ID linked to feed purchase for audit trail

---

## 6. DATABASE LAYER

### FeedPurchase Entity Structure

**Location:** `src/main/java/com/smartdairy/entity/FeedPurchase.java`

```java
@Entity
@Table(name = "feed_purchases")
public class FeedPurchase {
    private Long id;
    
    @ManyToOne
    private User admin;              // Multi-tenant isolation
    
    @ManyToOne
    private Farmer farmer;           // Associated farmer
    
    private LocalDate feedDate;      // Purchase date
    
    private String feedType;         // Normalized uppercase (e.g., CATTLE_FEED)
    
    private String feedCompanyName;  // Normalized uppercase (e.g., AMUL)
    
    private BigDecimal feedQuantity; // Quantity purchased
    
    private String unitType;         // Unit (KG, etc.)
    
    private BigDecimal ratePerUnit;  // Rate per unit
    
    private BigDecimal totalAmount;  // Calculated total
    
    private BigDecimal remainingAmount; // Outstanding balance
    
    private String notes;            // Optional notes
    
    @ManyToOne
    private Payment settledInPayment; // Link to payment if settled
    
    private Instant createdAt;       // Audit timestamp
}
```

### Key Database Fields

| Field | Type | Purpose | Storage Format |
|-------|------|---------|----------------|
| feedType | String(80) | Type of feed | UPPERCASE (CATTLE_FEED, SILAGE, etc.) |
| feedCompanyName | String(120) | Company name | UPPERCASE (AMUL, NANDINI, etc.) |
| feedQuantity | Decimal(12,2) | Quantity purchased | Numeric with 2 decimals |
| ratePerUnit | Decimal(12,2) | Rate per unit | Numeric with 2 decimals |
| totalAmount | Decimal(12,2) | Total cost | Calculated: qty × rate |
| remainingAmount | Decimal(12,2) | Outstanding balance | Deducted on payment |
| farmerId | FK | Foreign key to farmer | Multi-tenant scoped |
| adminId | FK | Foreign key to admin | Multi-tenant isolation |

### Database Indexes
```java
@Index(name = "idx_feed_purchases_admin_id", columnList = "admin_id")
@Index(name = "idx_feed_purchases_admin_date", columnList = "admin_id,feed_date")
@Index(name = "idx_feed_purchases_admin_farmer", columnList = "admin_id,farmer_id")
```

**Purpose:**
- Fast queries by admin (multi-tenant isolation)
- Fast date range queries for reports
- Fast farmer-specific queries

---

## 7. RESPONSE FLOW

### Entity to DTO Mapping

**Location:** `FeedPurchaseServiceImpl.toResponse()`

```java
private FeedPurchaseResponse toResponse(FeedPurchase f, String smsNotification) {
    return FeedPurchaseResponse.builder()
        .id(f.getId())
        .farmerId(f.getFarmer().getId())
        .farmerName(f.getFarmer().getFullName())
        .feedDate(f.getFeedDate())
        .feedType(f.getFeedType())
        .feedCompanyName(f.getFeedCompanyName())
        .feedQuantity(f.getFeedQuantity())
        .unitType(f.getUnitType())
        .ratePerUnit(f.getRatePerUnit())
        .totalAmount(f.getTotalAmount())
        .remainingAmount(f.getRemainingAmount())
        .notes(f.getNotes())
        .settledPaymentId(f.getSettledInPayment() != null ? f.getSettledInPayment().getId() : null)
        .createdAt(f.getCreatedAt())
        .smsNotification(smsNotification)
        .build();
}
```

### Frontend Response Handling

**Location:** `FeedPurchasesPage.jsx`

```javascript
const created = await createFeedPurchase(payload);
toast.success(created.smsNotification || "Feed purchase saved");
```

### UI Rendering with Formatting

**Formatter Functions:**
```javascript
function formatFeedType(value) {
  if (!value) return 'N/A';
  const normalizedValue = value.toUpperCase();
  const option = FEED_TYPE_OPTIONS.find(opt => opt.value === normalizedValue);
  return option ? option.label : value;  // CATTLE_FEED → Cattle Feed
}

function formatCompanyName(value) {
  if (!value) return 'N/A';
  const normalizedValue = value.toUpperCase();
  const option = COMPANY_NAME_OPTIONS.find(opt => opt.value === normalizedValue);
  return option ? option.label : value;  // AMUL → Amul
}
```

**Table Display:**
```javascript
<td>{formatFeedType(r.feedType)}</td>        // Shows "Cattle Feed"
<td>{formatCompanyName(r.feedCompanyName)}</td> // Shows "Amul"
<td>{r.feedQuantity}</td>                     // Shows "100" (no unit)
<td>₹ {r.totalAmount}</td>                    // Shows "₹ 2550.00"
```

---

## 8. FARMER SIDE FLOW

### API Endpoint

**GET** `/api/feed-purchases?farmerId={farmerId}&from={date}&to={date}`

**Farmer-Specific Controller:**
```java
@GetMapping
public ResponseEntity<List<FeedPurchaseResponse>> list(
    @RequestParam(value = "farmerId", required = false) Long farmerId,
    @RequestParam(value = "from", required = false) LocalDate from,
    @RequestParam(value = "to", required = false) LocalDate to) {
    return ResponseEntity.ok(feedPurchaseService.list(farmerId, from, to));
}
```

### JWT-Based Filtering

**Service Layer:**
```java
public List<FeedPurchaseResponse> list(Long farmerId, LocalDate from, LocalDate to) {
    User admin = userService.getLoggedInUser();  // Extracted from JWT
    
    List<FeedPurchase> rows;
    if (farmerId != null) {
        // Validate farmer belongs to admin
        findFarmerForAdmin(farmerId, admin);
        // Fetch only that farmer's purchases
        rows = feedPurchaseRepository.findByAdminAndFarmer_IdOrderByFeedDateDescCreatedAtDesc(admin, farmerId);
    } else if (from != null && to != null) {
        // Fetch all purchases in date range for admin
        rows = feedPurchaseRepository.findByAdminAndFeedDateBetweenOrderByFeedDateDescCreatedAtDesc(admin, from, to);
    } else {
        // Fetch all purchases for admin
        rows = feedPurchaseRepository.findByAdmin(admin);
    }
    return rows.stream().map(f -> toResponse(f, null)).toList();
}
```

### Farmer Frontend

**Location:** `frontend/src/pages/FarmerFeedPurchasesPage.jsx`

```javascript
useEffect(() => {
  getFarmerFeedPurchases()
    .then((res) => {
      setPurchases(Array.isArray(res) ? res : res?.data || []);
    })
    .catch(console.error)
    .finally(() => setLoading(false));
}, []);
```

**API Call:**
```javascript
// Location: frontend/src/services/farmer.js
export function getFarmerFeedPurchases() {
  return api.get("/feed-purchases").then((res) => res.data);
}
```

**JWT Context:**
- Farmer's JWT token contains their farmerId
- Backend extracts farmerId from token
- Automatically filters purchases for that farmer only
- No need to pass farmerId in request

---

## 9. COMPLETE FLOW SUMMARY

### End-to-End Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER ACTION                             │
│  User fills form → Selects Feed Type → Enters Quantity → Submit│
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      FRONTEND VALIDATION                        │
│  • Check OTHER custom fields not empty                          │
│  • Convert custom values to UPPERCASE                           │
│  • Calculate live total (qty × rate)                           │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API CALL (axios)                           │
│  POST /api/feed-purchases                                       │
│  Headers: Authorization: Bearer <JWT_TOKEN>                     │
│  Payload: { farmerId, feedType, feedCompanyName, ... }          │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                   SPRING SECURITY FILTER                         │
│  • Validate JWT token                                           │
│  • Extract user (admin) from token                              │
│  • Check role: hasRole('ADMIN')                                 │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      CONTROLLER LAYER                           │
│  @PostMapping create(@Valid @RequestBody FeedPurchaseRequest)   │
│  • JSR-303 validation on DTO                                     │
│  • Pass to service layer                                        │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                       SERVICE LAYER                              │
│  1. Validate operational date window                            │
│  2. Get admin from JWT context                                   │
│  3. Validate farmer belongs to admin (multi-tenant)              │
│  4. Normalize feedType to UPPERCASE                             │
│  5. Normalize companyName to UPPERCASE                          │
│  6. Validate against enum (if valid, use enum name)             │
│  7. Calculate totalAmount = qty × rate                         │
│  8. Map DTO → Entity                                            │
│  9. Save FeedPurchase to DB                                     │
│ 10. Update FarmerFinancialAccount (pendingOther += total)       │
│ 11. Create FarmerFinancialTransaction (audit trail)             │
│ 12. Send SMS notification                                        │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATABASE LAYER                              │
│  • Insert into feed_purchases table                             │
│  • Update farmer_financial_accounts table                        │
│  • Insert into farmer_financial_transactions table              │
│  • All stored with admin_id for multi-tenant isolation           │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      RESPONSE FLOW                               │
│  • Entity → DTO mapping (FeedPurchaseResponse)                  │
│  • Return to controller → HTTP 200 OK                           │
│  • Frontend receives response                                    │
│  • Show success toast with SMS notification                     │
│  • Reload data list                                              │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      UI RENDERING                                │
│  • Format feedType: CATTLE_FEED → "Cattle Feed"                 │
│  • Format companyName: AMUL → "Amul"                            │
│  • Display quantity without unit (e.g., "100")                  │
│  • Display total with currency (e.g., "₹ 2550.00")               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 10. INTERVIEW EXPLANATION (SHORT)

### "How does the Feed Purchase module work in your project?"

**Answer (1-2 minutes):**

"The Feed Purchase module allows dairy administrators to record feed purchases for farmers.
When an admin creates a feed purchase, they select the farmer, feed type (from predefined options
like Cattle Feed, Silage, etc.), company name, quantity, and rate. The frontend validates the form,
converts dropdown values to uppercase, and sends a POST request to `/api/feed-purchases` with a JWT token for authentication.

On the backend, Spring Security validates the token and ensures the user has ADMIN role.
The controller receives the request as a FeedPurchaseRequest DTO and passes it to the service layer. The service normalizes feed type and company 
name to uppercase for database consistency, calculates the total amount as quantity multiplied by rate, and saves the FeedPurchase entity.

Crucially, the module integrates with the financial system - it updates the farmer's financial account by adding the total to the `pendingOther` balance
(representing money owed for feed purchases), and creates an audit trail entry in the financial transactions table. When the farmer makes a payment later, 
the system automatically deducts this outstanding amount from their feed purchases using FIFO logic.

The data is stored with multi-tenant isolation using admin_id, and the response is mapped back to a DTO and sent to the frontend.
The frontend then formats the uppercase enum values to user-friendly labels (like 'Cattle Feed' instead of 'CATTLE_FEED')
and displays them in a table without units for cleaner presentation."

---

## Additional Notes

### Multi-Tenant Architecture
- All queries scoped by `admin_id` from JWT context
- Farmers belong to specific admins (tenants)
- Complete data isolation between tenants

### Data Consistency
- All feed types and company names stored in UPPERCASE
- Prevents case mismatches (amul vs AMUL vs Amul)
- Enum validation for predefined values, custom values allowed via OTHER

### Financial Integration
- Feed purchases create financial liability for farmers
- Automatic deduction when payments are made
- Complete audit trail via transaction entries

### Error Handling
- Operational date window validation
- Farmer ownership validation (multi-tenant)
- ResourceNotFoundException for missing data
- Validation errors returned with clear messages

### SMS Notification
- Automatic SMS sent to farmer on feed purchase creation
- Notification message included in response for frontend display
