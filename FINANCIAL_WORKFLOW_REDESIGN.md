# Financial Workflow Redesign - Single Source of Truth Architecture

## Overview
This document describes the redesigned financial workflow that implements a single source of truth architecture for the Dairy Management System.

## Architecture Principles

### 1. Single Source of Truth
- **Financial Ledger** (FarmerFinancialTransaction) is the single source of truth for all financial data
- All modules read from the ledger instead of calculating independently
- No duplicate calculations across modules

### 2. Centralized Services
Three new services provide centralized financial logic:

#### FinancialCalculationService
- **Purpose**: All financial calculations in one place
- **Methods**:
  - `calculateBill()` - Calculates bill with all deductions
  - `calculateNetPayable()` - Calculates net payable amount
  - `calculateTotalPendingBalance()` - Calculates total pending balance

#### FinancialRecoveryService
- **Purpose**: Automatic deduction recovery during bill generation
- **Methods**:
  - `recoverBillDeductions()` - Recovers all deductions from bill
  - `recoverAdvance()` - Recovers advance payment
  - `recoverLoan()` - Recovers loan amount
  - `recoverOther()` - Recovers other deductions
  - `recoverFeed()` - Recovers feed purchases

#### PaymentSettlementService
- **Purpose**: Payment processing in one database transaction
- **Methods**:
  - `settlePayment()` - Processes payment with all side effects

## Workflow Example

### Scenario
```
Milk Bill: ₹15000
Pending Advance: ₹800
Pending Feed: ₹1500
Pending Other: ₹2300
Pending Loan: ₹500
```

### Step 1: Bill Generation
1. User calls `generateFinalBill()` with deduction amounts
2. `FinancialCalculationService.calculateBill()` calculates:
   - Feed Deduction: ₹1500 (auto-calculated from feed purchases)
   - Advance Recovery: ₹800
   - Loan Recovery: ₹500
   - Other Recovery: ₹2300
   - Total Deductions: ₹5100
   - Net Payable: ₹9900

3. `FinancialRecoveryService.recoverBillDeductions()` automatically:
   - Updates FarmerFinancialAccount:
     - Pending Advance: 800 → 0
     - Pending Loan: 500 → 0
     - Pending Other: 2300 → 0
   - Creates ledger transactions:
     - ADVANCE_RECOVERED: ₹800
     - LOAN_RECOVERED: ₹500
     - OTHER_RECOVERED: ₹2300
     - FEED_PURCHASE_RECOVERED: ₹1500

### Step 2: Payment Processing
1. User calls `markPaid()` on payment
2. `PaymentSettlementService.settlePayment()` in one transaction:
   - Updates Payment status to PAID
   - Creates PAYMENT_RELEASED transaction: ₹9900
   - Updates Financial Ledger
   - No manual calculations required

### Step 3: Financial Analytics
1. Analytics reads from Financial Ledger
2. `calculateLedgerTotalsFromTransactions()` computes:
   - Pending Advance: 0
   - Pending Loan: 0
   - Pending Other: 0
   - Total Pending: 0
3. Reports show accurate, synchronized data

## Database Transaction Guarantees

All financial operations use `@Transactional` to ensure:
- Atomic updates across multiple tables
- Rollback on any failure
- No partial updates
- Data consistency

## Module Integration

### Milk Collection
- Records milk collection data
- No financial calculations

### Farmer Bill
- Uses `FinancialCalculationService` for calculations
- Uses `FinancialRecoveryService` for automatic recovery
- Creates bill record
- Updates ledger via recovery service

### Feed Purchases
- Records feed purchases
- Adds to pending other balance
- Automatically recovered during bill generation

### Financial Ledger
- Single source of truth
- Records every financial event
- Used by all modules for calculations

### Payments
- Uses `PaymentSettlementService` for processing
- Creates payment transaction
- Updates ledger in one transaction

### Financial Analytics
- Reads from ledger only
- No independent calculations
- Always synchronized

## Benefits

1. **No Duplicate Calculations**: All calculations in one place
2. **Automatic Recovery**: Deductions recovered automatically during bill generation
3. **Single Transaction**: Payment processing updates everything atomically
4. **Data Consistency**: Ledger is always the source of truth
5. **No Manual Adjustments**: System handles everything automatically
6. **Audit Trail**: Every financial event recorded in ledger

## Verification

The workflow now behaves exactly like a real dairy accounting system:
- Bill generation displays and recovers deductions
- Payment processing is automatic
- Ledger is always synchronized
- Analytics reads from ledger
- No pending amounts after full recovery
- All modules use the same financial data
