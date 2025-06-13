#!/usr/bin/env python3
"""
Git Repository Cleanup Assistant
===============================

Helps safely remove sensitive files from git tracking while preserving
the files locally. Creates backup recommendations and provides safe commands.

Usage: python git_cleanup_assistant.py
"""

import os
import subprocess

def safe_git_remove_files():
    """Generate safe commands to remove problematic files from git tracking"""
    
    print("🧹 GIT REPOSITORY CLEANUP ASSISTANT")
    print("=" * 50)
    print()
    print("⚠️  IMPORTANT: This script provides commands to remove files from git tracking")
    print("   The files will remain on your local system but won't be tracked by git.")
    print()
    
    # Files that should definitely be removed from tracking
    critical_files = [
        # Test files
        "tests/",
        "scripts/test-*.js",
        "coreagent/demo/manual-test-runner.ts",
        
        # Backup files  
        "backup/",
        
        # Server files with potential sensitive config
        "servers/gemini_mem0_server_v2.py",
        "servers/oneagent_memory_server.py",
        
        # Documentation with potentially sensitive info
        "docs/reports/oneagent_mcp_verification_report.md",
        "docs/production/ONEAGENT_MASTER_GUIDE.md",
        "docs/production/ONEAGENT_ROADMAP_v4.md"
    ]
    
    print("🔧 RECOMMENDED CLEANUP COMMANDS:")
    print()
    print("# 1. Remove entire test directories from git tracking:")
    print("git rm -r --cached tests/")
    print("git rm -r --cached backup/")
    print()
    
    print("# 2. Remove specific sensitive server files:")
    print("git rm --cached servers/gemini_mem0_server_v2.py")
    print("git rm --cached servers/oneagent_memory_server.py")
    print()
    
    print("# 3. Remove documentation with potential sensitive info:")
    print("git rm --cached docs/reports/oneagent_mcp_verification_report.md")
    print("git rm --cached docs/production/ONEAGENT_MASTER_GUIDE.md")
    print("git rm --cached docs/production/ONEAGENT_ROADMAP_v4.md")
    print()
    
    print("# 4. Remove manual test files:")
    print("git rm --cached coreagent/demo/manual-test-runner.ts")
    print("git rm --cached scripts/test-*.js")
    print()
    
    print("# 5. After running the above commands, commit the cleanup:")
    print("git add .gitignore")
    print("git commit -m \"Security: Remove sensitive files from git tracking and update .gitignore\"")
    print()
    
    print("✅ SAFETY NOTES:")
    print("- These commands only remove files from git tracking")
    print("- Your local files will NOT be deleted")
    print("- Files will be preserved in your working directory")
    print("- .gitignore will prevent them from being tracked again")
    print()
    
    print("⚠️  VERIFY BEFORE RUNNING:")
    print("- Review each command before executing")
    print("- Ensure you have backups of important files")
    print("- Test the commands on a copy of the repository first")
    print()

def show_current_status():
    """Show current repository status"""
    print("📊 CURRENT REPOSITORY STATUS:")
    print()
    
    try:
        # Show tracked files count
        result = subprocess.run(['git', 'ls-files'], capture_output=True, text=True)
        tracked_count = len(result.stdout.strip().split('\n')) if result.stdout.strip() else 0
        print(f"📁 Total tracked files: {tracked_count}")
        
        # Show untracked files count
        result = subprocess.run(['git', 'status', '--porcelain'], capture_output=True, text=True)
        untracked_lines = [line for line in result.stdout.split('\n') if line.startswith('??')]
        untracked_count = len(untracked_lines)
        print(f"📄 Untracked files: {untracked_count}")
        
        # Show ignored files count
        result = subprocess.run(['git', 'status', '--ignored', '--porcelain'], capture_output=True, text=True)
        ignored_lines = [line for line in result.stdout.split('\n') if line.startswith('!!')]
        ignored_count = len(ignored_lines)
        print(f"🚫 Ignored files: {ignored_count}")
        
    except Exception as e:
        print(f"Error getting repository status: {e}")

if __name__ == "__main__":
    show_current_status()
    print()
    safe_git_remove_files()
