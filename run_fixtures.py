import sys
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from adapters.orm.models.database import Base
from adapters.orm.fixtures import create_fixtures

def main():
    # Get database URL from environment variable or use default
    database_url = os.getenv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/assistant_db')
    
    try:
        # Create engine and session
        engine = create_engine(database_url)
        Session = sessionmaker(bind=engine)
        session = Session()
        
        # Create tables if they don't exist
        Base.metadata.create_all(engine)
        
        # Run fixtures
        print("Creating fixtures...")
        fixtures = create_fixtures(session)
        
        # Print summary
        print("\nFixtures created successfully:")
        print(f"- Users: {len(fixtures['users'])}")
        print(f"- User Settings: {len(fixtures['user_settings'])}")
        print(f"- Workspace: 1")
        print(f"- Board: 1")
        print(f"- Tasks: {len(fixtures['tasks'])}")
        print(f"- Time Blocks: {len(fixtures['time_blocks'])}")
        print(f"- Comments: {len(fixtures['comments'])}")
        print(f"- Tags: {len(fixtures['tags'])}")
        
        # Print user credentials
        print("\nTest User Credentials:")
        for user in fixtures['users']:
            print(f"- Email: {user.email}")
            print(f"  Role: {user.role}")
            print(f"  User Type: {user.user_type}")
        
    except Exception as e:
        print(f"Error creating fixtures: {str(e)}")
        sys.exit(1)
    finally:
        session.close()

if __name__ == "__main__":
    main() 