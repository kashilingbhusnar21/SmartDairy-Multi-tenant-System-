-- Create farmer_financial_transactions table
-- This table stores all financial transactions for farmers in the multi-tenant dairy management system

CREATE TABLE IF NOT EXISTS farmer_financial_transactions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    account_id BIGINT NOT NULL,
    farmer_id BIGINT NOT NULL,
    admin_id BIGINT NOT NULL,
    transaction_type VARCHAR(30) NOT NULL,
    reference_type VARCHAR(20),
    reference_id VARCHAR(255),
    amount DECIMAL(12, 2) NOT NULL,
    balance_before DECIMAL(12, 2) NOT NULL,
    balance_after DECIMAL(12, 2) NOT NULL,
    description VARCHAR(500),
    transaction_date DATE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT fk_financial_transactions_account 
        FOREIGN KEY (account_id) REFERENCES farmer_financial_accounts(id) ON DELETE CASCADE,
    CONSTRAINT fk_financial_transactions_farmer 
        FOREIGN KEY (farmer_id) REFERENCES farmers(id) ON DELETE CASCADE,
    CONSTRAINT fk_financial_transactions_admin 
        FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for performance and query optimization
CREATE INDEX idx_financial_transactions_admin_id ON farmer_financial_transactions(admin_id);
CREATE INDEX idx_financial_transactions_farmer_id ON farmer_financial_transactions(farmer_id);
CREATE INDEX idx_financial_transactions_account_id ON farmer_financial_transactions(account_id);
CREATE INDEX idx_financial_transactions_date ON farmer_financial_transactions(transaction_date);

-- Create composite index for common query patterns
CREATE INDEX idx_financial_transactions_admin_farmer_date 
    ON farmer_financial_transactions(admin_id, farmer_id, transaction_date);
