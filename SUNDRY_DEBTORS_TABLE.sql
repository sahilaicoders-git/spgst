-- ============================================
-- SUNDRY DEBTORS TABLE - SQLite Schema
-- ============================================
-- This table stores customer/debtor information for quick B2B sales entry
-- Each client database has its own sundry_debtors table
-- ============================================

-- CREATE TABLE
CREATE TABLE IF NOT EXISTS sundry_debtors (
    id TEXT PRIMARY KEY,                                    -- Unique UUID for each debtor
    debtor_name TEXT NOT NULL,                              -- Customer/Debtor name
    gstin TEXT NOT NULL UNIQUE,                             -- GST Identification Number (15 characters, unique)
    address TEXT,                                           -- Full address (optional)
    contact TEXT,                                           -- Contact number (optional)
    email TEXT,                                             -- Email address (optional)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,         -- Record creation timestamp
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP          -- Last update timestamp
);

-- ============================================
-- INDEXES for Performance
-- ============================================

-- Index on debtor_name for faster name searches
CREATE INDEX IF NOT EXISTS idx_debtor_name ON sundry_debtors(debtor_name);

-- Index on gstin for faster GSTIN lookups
CREATE INDEX IF NOT EXISTS idx_debtor_gstin ON sundry_debtors(gstin);

-- Index on created_at for sorting by date
CREATE INDEX IF NOT EXISTS idx_debtor_created ON sundry_debtors(created_at DESC);

-- ============================================
-- SAMPLE INSERT QUERIES
-- ============================================

-- Insert a new debtor
INSERT INTO sundry_debtors (
    id, 
    debtor_name, 
    gstin, 
    address, 
    contact, 
    email
) VALUES (
    'uuid-generated-value',
    'ABC Company Limited',
    '29ABCDE1234F1Z5',
    '123, MG Road, Mumbai, Maharashtra - 400001',
    '9876543210',
    'contact@abccompany.com'
);

-- Insert debtor with minimal info (only required fields)
INSERT INTO sundry_debtors (
    id, 
    debtor_name, 
    gstin
) VALUES (
    'uuid-generated-value-2',
    'XYZ Traders',
    '27XYZAB5678G2A1'
);

-- ============================================
-- SAMPLE DATA (Examples)
-- ============================================

-- Example 1: Full details
INSERT INTO sundry_debtors VALUES (
    '550e8400-e29b-41d4-a716-446655440001',
    'Global Trading Corporation',
    '24GLBTR9012H3B2',
    'Plot 456, Industrial Area, Ahmedabad, Gujarat - 380015',
    '9123456789',
    'info@globaltrading.com',
    '2025-10-21 10:30:00',
    '2025-10-21 10:30:00'
);

-- Example 2: Retail client
INSERT INTO sundry_debtors VALUES (
    '550e8400-e29b-41d4-a716-446655440002',
    'Super Retail Mart Pvt Ltd',
    '27SUPRT3456M8N9',
    '78, Commercial Street, New Delhi - 110001',
    '9234567890',
    'accounts@superretail.in',
    '2025-10-21 11:00:00',
    '2025-10-21 11:00:00'
);

-- Example 3: Manufacturing client
INSERT INTO sundry_debtors VALUES (
    '550e8400-e29b-41d4-a716-446655440003',
    'Precision Manufacturing Industries',
    '29PRECMF7890K1L2',
    'Factory Road, MIDC Area, Pune, Maharashtra - 411019',
    '9345678901',
    'sales@precisionmfg.co.in',
    '2025-10-21 11:30:00',
    '2025-10-21 11:30:00'
);

-- ============================================
-- USEFUL SELECT QUERIES
-- ============================================

-- Get all debtors ordered by name
SELECT * FROM sundry_debtors 
ORDER BY debtor_name ASC;

-- Get all debtors with contact info
SELECT id, debtor_name, gstin, contact, email 
FROM sundry_debtors 
WHERE contact IS NOT NULL OR email IS NOT NULL
ORDER BY debtor_name;

-- Search debtors by name (case-insensitive)
SELECT * FROM sundry_debtors 
WHERE LOWER(debtor_name) LIKE '%trading%'
ORDER BY debtor_name;

-- Search debtors by GSTIN
SELECT * FROM sundry_debtors 
WHERE gstin LIKE '29%'  -- All Maharashtra GSTINs
ORDER BY debtor_name;

-- Get recently added debtors (last 7 days)
SELECT * FROM sundry_debtors 
WHERE created_at >= datetime('now', '-7 days')
ORDER BY created_at DESC;

-- Get debtors with incomplete information
SELECT * FROM sundry_debtors 
WHERE address IS NULL OR contact IS NULL OR email IS NULL
ORDER BY debtor_name;

-- Count total debtors
SELECT COUNT(*) as total_debtors FROM sundry_debtors;

-- Count debtors by state (based on GSTIN prefix)
SELECT 
    SUBSTR(gstin, 1, 2) as state_code,
    COUNT(*) as debtor_count
FROM sundry_debtors
GROUP BY SUBSTR(gstin, 1, 2)
ORDER BY debtor_count DESC;

-- Get debtors for autocomplete (name and GSTIN)
SELECT id, debtor_name, gstin 
FROM sundry_debtors 
WHERE LOWER(debtor_name) LIKE '%abc%' 
   OR LOWER(gstin) LIKE '%abc%'
ORDER BY debtor_name
LIMIT 5;

-- ============================================
-- UPDATE QUERIES
-- ============================================

-- Update debtor information
UPDATE sundry_debtors 
SET 
    debtor_name = 'Updated Company Name',
    address = 'New Address',
    contact = '9999999999',
    email = 'newemail@company.com',
    updated_at = CURRENT_TIMESTAMP
WHERE id = 'debtor-id-here';

-- Update only contact number
UPDATE sundry_debtors 
SET contact = '9876543210', updated_at = CURRENT_TIMESTAMP
WHERE gstin = '29ABCDE1234F1Z5';

-- Update only email
UPDATE sundry_debtors 
SET email = 'updated@email.com', updated_at = CURRENT_TIMESTAMP
WHERE id = 'debtor-id-here';

-- ============================================
-- DELETE QUERIES
-- ============================================

-- Delete a specific debtor by ID
DELETE FROM sundry_debtors 
WHERE id = 'debtor-id-here';

-- Delete debtor by GSTIN
DELETE FROM sundry_debtors 
WHERE gstin = '29ABCDE1234F1Z5';

-- Delete all debtors (use with caution!)
DELETE FROM sundry_debtors;

-- ============================================
-- VALIDATION QUERIES
-- ============================================

-- Check if GSTIN already exists
SELECT COUNT(*) as exists_count 
FROM sundry_debtors 
WHERE gstin = '29ABCDE1234F1Z5';

-- Check if debtor name already exists
SELECT COUNT(*) as exists_count 
FROM sundry_debtors 
WHERE LOWER(debtor_name) = LOWER('ABC Company Limited');

-- Find duplicate GSTINs (should return 0 due to UNIQUE constraint)
SELECT gstin, COUNT(*) as count 
FROM sundry_debtors 
GROUP BY gstin 
HAVING COUNT(*) > 1;

-- Validate GSTIN format (15 characters)
SELECT * FROM sundry_debtors 
WHERE LENGTH(gstin) != 15;

-- ============================================
-- REPORTING QUERIES
-- ============================================

-- Get debtor statistics
SELECT 
    COUNT(*) as total_debtors,
    COUNT(address) as with_address,
    COUNT(contact) as with_contact,
    COUNT(email) as with_email,
    COUNT(*) - COUNT(address) as missing_address,
    COUNT(*) - COUNT(contact) as missing_contact,
    COUNT(*) - COUNT(email) as missing_email
FROM sundry_debtors;

-- Debtors by state (using GSTIN state code)
SELECT 
    CASE SUBSTR(gstin, 1, 2)
        WHEN '01' THEN 'Jammu and Kashmir'
        WHEN '02' THEN 'Himachal Pradesh'
        WHEN '03' THEN 'Punjab'
        WHEN '07' THEN 'Delhi'
        WHEN '24' THEN 'Gujarat'
        WHEN '27' THEN 'Maharashtra'
        WHEN '29' THEN 'Karnataka'
        WHEN '32' THEN 'Kerala'
        WHEN '33' THEN 'Tamil Nadu'
        WHEN '36' THEN 'Telangana'
        WHEN '37' THEN 'Andhra Pradesh'
        ELSE 'Other'
    END as state_name,
    COUNT(*) as debtor_count
FROM sundry_debtors
GROUP BY SUBSTR(gstin, 1, 2)
ORDER BY debtor_count DESC;

-- Recently updated debtors
SELECT 
    debtor_name,
    gstin,
    updated_at,
    CAST((JULIANDAY('now') - JULIANDAY(updated_at)) AS INTEGER) as days_since_update
FROM sundry_debtors
WHERE updated_at != created_at
ORDER BY updated_at DESC
LIMIT 10;

-- ============================================
-- MAINTENANCE QUERIES
-- ============================================

-- View table schema
PRAGMA table_info(sundry_debtors);

-- Check indexes
PRAGMA index_list(sundry_debtors);

-- Analyze table for query optimization
ANALYZE sundry_debtors;

-- Vacuum database (optimize and reclaim space)
VACUUM;

-- ============================================
-- EXPORT QUERIES
-- ============================================

-- Export to CSV format (results can be saved)
SELECT 
    debtor_name as "Debtor Name",
    gstin as "GSTIN",
    address as "Address",
    contact as "Contact",
    email as "Email",
    created_at as "Created At"
FROM sundry_debtors
ORDER BY debtor_name;

-- Export for backup
SELECT * FROM sundry_debtors;

-- ============================================
-- GSTIN STATE CODES REFERENCE
-- ============================================
/*
01 - Jammu and Kashmir
02 - Himachal Pradesh
03 - Punjab
04 - Chandigarh
05 - Uttarakhand
06 - Haryana
07 - Delhi
08 - Rajasthan
09 - Uttar Pradesh
10 - Bihar
11 - Sikkim
12 - Arunachal Pradesh
13 - Nagaland
14 - Manipur
15 - Mizoram
16 - Tripura
17 - Meghalaya
18 - Assam
19 - West Bengal
20 - Jharkhand
21 - Odisha
22 - Chhattisgarh
23 - Madhya Pradesh
24 - Gujarat
27 - Maharashtra
29 - Karnataka
32 - Kerala
33 - Tamil Nadu
36 - Telangana
37 - Andhra Pradesh
*/

-- ============================================
-- NOTES
-- ============================================
/*
1. The 'id' field uses UUID format for unique identification
2. GSTIN must be exactly 15 characters and follow GST format
3. GSTIN is UNIQUE - duplicate GSTINs will cause insert errors
4. All timestamps are in UTC
5. Optional fields (address, contact, email) can be NULL
6. Use transactions for bulk operations for better performance
7. Regular VACUUM operations help maintain database performance
8. Indexes improve search performance on name and GSTIN
9. Always use parameterized queries to prevent SQL injection
10. The table is created per client database (not in main database)
*/

-- ============================================
-- TRANSACTION EXAMPLE
-- ============================================

BEGIN TRANSACTION;

-- Insert multiple debtors
INSERT INTO sundry_debtors VALUES 
('id-1', 'Company A', '29ABC1234DEF1Z5', 'Address A', '9111111111', 'a@example.com', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('id-2', 'Company B', '27XYZ5678GHI2A1', 'Address B', '9222222222', 'b@example.com', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('id-3', 'Company C', '24LMN9012JKL3B2', 'Address C', '9333333333', 'c@example.com', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

COMMIT;

-- If there's an error, use:
-- ROLLBACK;

-- ============================================
-- END OF SQL DOCUMENTATION
-- ============================================

