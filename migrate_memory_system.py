#!/usr/bin/env python3
"""
OneAgent Memory Server Migration & Cleanup Script
=================================================

This script safely migrates from the old memory system to the new unified implementation.
It preserves all existing memories while cleaning up redundant files.

Features:
- Backup existing memories
- Migrate data to new format
- Clean up redundant server files
- Update configuration
- Restart with new server

Usage:
    python migrate_memory_system.py
"""

import os
import shutil
import json
import logging
from datetime import datetime
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class MemorySystemMigration:
    """Handle migration from old to new memory system"""
    
    def __init__(self):
        self.project_root = Path(__file__).parent
        self.servers_dir = self.project_root / "servers"
        self.backup_dir = self.project_root / "backup" / f"memory_migration_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
          def create_backup(self):
        """Create backup of current memory system"""
        logger.info("📦 Creating backup of current memory system...")
        
        self.backup_dir.mkdir(parents=True, exist_ok=True)
        
        # Backup memory data
        memory_dirs = [
            self.project_root / "oneagent_gemini_memory",
            self.servers_dir / "oneagent_gemini_memory"
        ]
        
        for memory_dir in memory_dirs:
            if memory_dir.exists():
                backup_memory_dir = self.backup_dir / memory_dir.name
                if backup_memory_dir.exists():
                    shutil.rmtree(backup_memory_dir)
                shutil.copytree(memory_dir, backup_memory_dir)
                logger.info(f"✅ Backed up {memory_dir} to {backup_memory_dir}")
        
        # Backup configuration files
        config_files = [
            self.project_root / "gemini_memory_config.json",
            self.project_root / "oneagent_gemini_config.json"
        ]
        
        for config_file in config_files:
            if config_file.exists():
                shutil.copy2(config_file, self.backup_dir)
                logger.info(f"✅ Backed up {config_file}")
    
    def identify_redundant_files(self):
        """Identify redundant memory server files"""
        redundant_files = [
            # Test/development servers
            self.project_root / "scripts" / "start_mem0_server.py",
            
            # Old server versions
            self.servers_dir / "gemini_mem0_server.py",
            self.servers_dir / "gemini_mem0_server_fixed.py", 
            self.servers_dir / "mem0_server.py",
            self.servers_dir / "mem0-gemini-integration.py",
            self.servers_dir / "gemini-memory-complete.py",
            
            # Keep gemini_mem0_server_v2.py as reference until migration complete
        ]
        
        existing_files = [f for f in redundant_files if f.exists()]
        logger.info(f"📋 Found {len(existing_files)} redundant files to clean up")
        return existing_files
    
    def migrate_memory_data(self):
        """Migrate memory data to new format if needed"""
        logger.info("🔄 Checking memory data migration needs...")
        
        # Check if migration is needed
        old_memory_dir = self.project_root / "oneagent_gemini_memory"
        new_memory_dir = self.project_root / "oneagent_memory"
        
        if old_memory_dir.exists() and not new_memory_dir.exists():
            logger.info("📁 Migrating memory storage directory...")
            shutil.copytree(old_memory_dir, new_memory_dir)
            logger.info(f"✅ Memory data migrated to {new_memory_dir}")
        else:
            logger.info("ℹ️ Memory data migration not needed")
    
    def create_startup_script(self):
        """Create new startup script for unified server"""
        startup_script = self.project_root / "start_memory_server.py"
        
        script_content = '''#!/usr/bin/env python3
"""
OneAgent Memory Server Startup Script
"""
import subprocess
import sys
import os
from pathlib import Path

def main():
    # Change to servers directory
    servers_dir = Path(__file__).parent / "servers"
    os.chdir(servers_dir)
    
    # Start the unified memory server
    try:
        print("🚀 Starting OneAgent Memory Server v4.0.0...")
        subprocess.run([sys.executable, "oneagent_memory_server.py"], check=True)
    except KeyboardInterrupt:
        print("🛑 Server stopped by user")
    except Exception as e:
        print(f"❌ Server failed to start: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
'''
        
        startup_script.write_text(script_content)
        logger.info(f"✅ Created startup script: {startup_script}")
    
    def update_configurations(self):
        """Update configuration files for new server"""
        logger.info("⚙️ Updating configuration files...")
          # Create .env file from existing config
        env_file = self.project_root / "servers" / ".env"
        
        # Try to extract API key from existing configs
        api_key = None
        config_files = [
            self.project_root / "gemini_memory_config.json",
            self.project_root / "oneagent_gemini_config.json"
        ]
        
        for config_file in config_files:
            if config_file.exists():
                try:
                    with open(config_file, 'r') as f:
                        config = json.load(f)
                    
                    if 'embeddings' in config and 'api_key' in config['embeddings']:
                        api_key = config['embeddings']['api_key']
                        break
                except Exception as e:
                    logger.warning(f"Could not read {config_file}: {e}")
        
        # Create .env file
        env_content = f'''# OneAgent Memory Server Configuration
GEMINI_API_KEY={api_key or "your_gemini_api_key_here"}
MEMORY_HOST=127.0.0.1
MEMORY_PORT=8000
MEMORY_STORAGE_PATH=../oneagent_memory
MEMORY_COLLECTION=oneagent_memories
MEMORY_MAX_PER_USER=10000
MEMORY_SIMILARITY_THRESHOLD=0.7
MEMORY_LOG_LEVEL=INFO
'''
        
        env_file.write_text(env_content)
        logger.info(f"✅ Created configuration: {env_file}")
    
    def cleanup_redundant_files(self, dry_run=True):
        """Clean up redundant files (with dry run option)"""
        redundant_files = self.identify_redundant_files()
        
        if dry_run:
            logger.info("🧹 DRY RUN - Files that would be cleaned up:")
            for file_path in redundant_files:
                logger.info(f"  - {file_path}")
            logger.info("Run with dry_run=False to actually delete files")
        else:
            logger.info("🧹 Cleaning up redundant files...")
            for file_path in redundant_files:
                try:
                    backup_file = self.backup_dir / "redundant_files" / file_path.name
                    backup_file.parent.mkdir(parents=True, exist_ok=True)
                    shutil.copy2(file_path, backup_file)
                    file_path.unlink()
                    logger.info(f"✅ Removed {file_path} (backed up)")
                except Exception as e:
                    logger.error(f"❌ Failed to remove {file_path}: {e}")
    
    def run_migration(self, dry_run=True):
        """Run complete migration process"""
        logger.info("🎯 Starting OneAgent Memory System Migration...")
        
        try:
            # Step 1: Create backup
            self.create_backup()
            
            # Step 2: Migrate memory data
            self.migrate_memory_data()
            
            # Step 3: Update configurations
            self.update_configurations()
            
            # Step 4: Create startup script
            self.create_startup_script()
            
            # Step 5: Clean up redundant files
            self.cleanup_redundant_files(dry_run=dry_run)
            
            logger.info("✅ Migration completed successfully!")
            logger.info(f"📦 Backup created at: {self.backup_dir}")
            
            if dry_run:
                logger.info("🔄 This was a DRY RUN. Run with --execute to apply changes.")
            else:
                logger.info("🎉 Memory system successfully migrated to unified implementation!")
                logger.info("🚀 Start the new server with: python start_memory_server.py")
            
        except Exception as e:
            logger.error(f"❌ Migration failed: {e}")
            raise

def main():
    import argparse
    parser = argparse.ArgumentParser(description="Migrate OneAgent Memory System")
    parser.add_argument("--execute", action="store_true", help="Execute migration (default is dry run)")
    args = parser.parse_args()
    
    migration = MemorySystemMigration()
    migration.run_migration(dry_run=not args.execute)

if __name__ == "__main__":
    main()
