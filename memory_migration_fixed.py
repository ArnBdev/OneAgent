#!/usr/bin/env python3
"""
OneAgent Memory System Migration Script
======================================

Consolidates multiple memory server implementations into a single unified solution.
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

class MemoryMigration:
    """Memory system migration and cleanup"""
    
    def __init__(self):
        self.project_root = Path(__file__).parent
        self.servers_dir = self.project_root / "servers"
        self.backup_dir = self.project_root / "backup" / f"memory_migration_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    
    def create_backup(self):
        """Create backup of current system"""
        logger.info("📦 Creating backup...")
        
        self.backup_dir.mkdir(parents=True, exist_ok=True)
        
        # Backup memory data directory
        memory_dir = self.project_root / "oneagent_gemini_memory"
        if memory_dir.exists():
            backup_memory_dir = self.backup_dir / "oneagent_gemini_memory"
            shutil.copytree(memory_dir, backup_memory_dir)
            logger.info(f"✅ Backed up memory data: {memory_dir}")
        
        # Backup config files
        config_files = [
            "gemini_memory_config.json",
            "oneagent_gemini_config.json"
        ]
        
        for config_file in config_files:
            config_path = self.project_root / config_file
            if config_path.exists():
                shutil.copy2(config_path, self.backup_dir)
                logger.info(f"✅ Backed up config: {config_file}")
    
    def identify_redundant_files(self):
        """Find redundant memory server implementations"""
        redundant_files = []
        
        # Check servers directory
        server_files = [
            "mem0_server.py",
            "gemini_mem0_server.py", 
            "gemini_mem0_server_fixed.py",
            "mem0-gemini-integration.py",
            "gemini-memory-complete.py"
        ]
        
        for server_file in server_files:
            file_path = self.servers_dir / server_file
            if file_path.exists():
                redundant_files.append(file_path)
        
        # Check scripts directory  
        script_files = [
            "start_mem0_server.py"
        ]
        
        for script_file in script_files:
            file_path = self.project_root / "scripts" / script_file
            if file_path.exists():
                redundant_files.append(file_path)
        
        logger.info(f"📋 Found {len(redundant_files)} redundant files")
        return redundant_files
    
    def cleanup_files(self, files_to_remove, dry_run=True):
        """Remove redundant files"""
        if dry_run:
            logger.info("🧹 DRY RUN - Files that would be removed:")
            for file_path in files_to_remove:
                logger.info(f"  - {file_path}")
        else:
            logger.info("🧹 Removing redundant files...")
            for file_path in files_to_remove:
                try:
                    # Backup before deletion
                    backup_file = self.backup_dir / "removed_files" / file_path.name
                    backup_file.parent.mkdir(parents=True, exist_ok=True)
                    shutil.copy2(file_path, backup_file)
                    
                    # Remove original
                    file_path.unlink()
                    logger.info(f"✅ Removed {file_path} (backed up)")
                except Exception as e:
                    logger.error(f"❌ Failed to remove {file_path}: {e}")
    
    def create_env_config(self):
        """Create .env configuration for unified server"""
        logger.info("⚙️ Creating .env configuration...")
        
        # Create servers directory if it doesn't exist
        self.servers_dir.mkdir(exist_ok=True)
        
        # Extract API key from existing config if available
        api_key = "your_gemini_api_key_here"
        
        try:
            config_file = self.project_root / "gemini_memory_config.json"
            if config_file.exists():
                with open(config_file, 'r') as f:
                    config = json.load(f)
                    if 'embeddings' in config and 'api_key' in config['embeddings']:
                        api_key = config['embeddings']['api_key']
        except Exception as e:
            logger.warning(f"Could not extract API key: {e}")
        
        # Create .env file
        env_content = f"""# OneAgent Memory Server Configuration
GEMINI_API_KEY={api_key}
MEMORY_HOST=127.0.0.1
MEMORY_PORT=8000
MEMORY_STORAGE_PATH=../oneagent_gemini_memory
MEMORY_COLLECTION=oneagent_memories
LOG_LEVEL=INFO
"""
        
        env_file = self.servers_dir / ".env"
        env_file.write_text(env_content)
        logger.info(f"✅ Created configuration: {env_file}")
    
    def run_migration(self, dry_run=True):
        """Execute the migration process"""
        logger.info("🎯 Starting OneAgent Memory System Migration...")
        
        try:
            # Step 1: Create backup
            self.create_backup()
            
            # Step 2: Identify redundant files
            redundant_files = self.identify_redundant_files()
            
            # Step 3: Create new configuration
            self.create_env_config()
            
            # Step 4: Clean up redundant files
            self.cleanup_files(redundant_files, dry_run=dry_run)
            
            logger.info("✅ Migration completed successfully!")
            logger.info(f"📦 Backup created at: {self.backup_dir}")
            
            if dry_run:
                logger.info("🔄 This was a DRY RUN. Use --execute to apply changes.")
            else:
                logger.info("🎉 Memory system migration complete!")
                logger.info("🔧 Current active server: gemini_mem0_server_v2.py")
                logger.info("🚀 New unified server ready at: oneagent_memory_server.py")
            
        except Exception as e:
            logger.error(f"❌ Migration failed: {e}")
            raise

def main():
    import argparse
    parser = argparse.ArgumentParser(description="Migrate OneAgent Memory System")
    parser.add_argument("--execute", action="store_true", help="Execute migration (default is dry run)")
    args = parser.parse_args()
    
    migration = MemoryMigration()
    migration.run_migration(dry_run=not args.execute)

if __name__ == "__main__":
    main()
