import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from adapters.orm.models.database import Base

def truncate_all_tables():
    # Get database URL from environment variable or use default
    database_url = os.getenv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/assistant_db')
    
    try:
        # Create engine
        engine = create_engine(database_url)
        
        # Get all table names
        with engine.connect() as conn:
            # Get all table names in the public schema
            result = conn.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_type = 'BASE TABLE'
            """))
            tables = [row[0] for row in result]
            
            # Disable foreign key checks temporarily
            conn.execute(text('SET session_replication_role = replica;'))
            
            # Truncate each table
            for table in tables:
                print(f"Truncating table: {table}")
                conn.execute(text(f'TRUNCATE TABLE "{table}" CASCADE;'))
            
            # Re-enable foreign key checks
            conn.execute(text('SET session_replication_role = DEFAULT;'))
            
            # Commit the transaction
            conn.commit()
            
        print("\nAll tables have been truncated successfully!")
        
    except Exception as e:
        print(f"Error truncating tables: {str(e)}")
        raise

if __name__ == "__main__":
    truncate_all_tables() 