import os
import sys
from alembic.config import Config
from alembic import command

def run_migrations():
    # Get the absolute path to the migrations directory
    migrations_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'migrations')
    
    # Create Alembic configuration
    alembic_cfg = Config()
    alembic_cfg.set_main_option('script_location', migrations_dir)
    alembic_cfg.set_main_option('sqlalchemy.url', os.getenv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/assistant'))
    
    try:
        # Run the migration
        command.upgrade(alembic_cfg, 'head')
        print("Migrations completed successfully!")
    except Exception as e:
        print(f"Error running migrations: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    run_migrations() 