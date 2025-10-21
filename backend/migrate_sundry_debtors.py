"""
Migration script to add sundry_debtors table to existing client databases
Run this script once to update all existing client databases
"""

import sqlite3
import os
import glob

# Directory containing client databases
CLIENT_DB_DIR = 'client_databases'

def migrate_database(db_path):
    """Add sundry_debtors table to a client database"""
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if table already exists
        cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='sundry_debtors'
        """)
        
        if cursor.fetchone():
            print(f"✓ Table already exists in {os.path.basename(db_path)}")
            conn.close()
            return True
        
        # Create sundry_debtors table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS sundry_debtors (
                id TEXT PRIMARY KEY,
                debtor_name TEXT NOT NULL,
                gstin TEXT NOT NULL UNIQUE,
                address TEXT,
                contact TEXT,
                email TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Create indexes for better performance
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_debtor_name 
            ON sundry_debtors(debtor_name)
        ''')
        
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_debtor_gstin 
            ON sundry_debtors(gstin)
        ''')
        
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_debtor_created 
            ON sundry_debtors(created_at DESC)
        ''')
        
        conn.commit()
        conn.close()
        
        print(f"✓ Successfully migrated {os.path.basename(db_path)}")
        return True
        
    except Exception as e:
        print(f"✗ Error migrating {os.path.basename(db_path)}: {str(e)}")
        return False

def main():
    """Migrate all client databases"""
    print("=" * 60)
    print("SUNDRY DEBTORS TABLE MIGRATION")
    print("=" * 60)
    print()
    
    # Check if client_databases directory exists
    if not os.path.exists(CLIENT_DB_DIR):
        print(f"✗ Directory '{CLIENT_DB_DIR}' not found!")
        print(f"  Current directory: {os.getcwd()}")
        return
    
    # Find all .db files in client_databases directory
    db_files = glob.glob(os.path.join(CLIENT_DB_DIR, '*.db'))
    
    if not db_files:
        print(f"✗ No database files found in '{CLIENT_DB_DIR}'")
        return
    
    print(f"Found {len(db_files)} client database(s):")
    for db_file in db_files:
        print(f"  - {os.path.basename(db_file)}")
    print()
    
    # Migrate each database
    success_count = 0
    fail_count = 0
    
    for db_file in db_files:
        if migrate_database(db_file):
            success_count += 1
        else:
            fail_count += 1
    
    print()
    print("=" * 60)
    print("MIGRATION SUMMARY")
    print("=" * 60)
    print(f"Total databases: {len(db_files)}")
    print(f"Successful: {success_count}")
    print(f"Failed: {fail_count}")
    print()
    
    if fail_count == 0:
        print("✓ All databases migrated successfully!")
    else:
        print("⚠ Some databases failed to migrate. Check errors above.")

if __name__ == '__main__':
    main()

