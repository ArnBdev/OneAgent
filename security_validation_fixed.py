#!/usr/bin/env python3
"""
OneAgent Security Validation Script - Fixed
==========================================

Validates that sensitive files are properly excluded from git tracking
and provides recommendations for improving repository security.

Usage: python security_validation.py
"""

import os
import subprocess
import json
from pathlib import Path

def run_git_command(cmd):
    """Run a git command and return output"""
    try:
        result = subprocess.run(
            ['git'] + cmd, 
            capture_output=True, 
            text=True, 
            cwd='.'
        )
        return result.stdout.strip().split('\n') if result.stdout.strip() else []
    except Exception as e:
        print(f"Error running git command: {e}")
        return []

def check_sensitive_patterns():
    """Check for potentially sensitive files in git tracking"""
    print("🔍 Checking for sensitive files in git tracking...\n")
    
    tracked_files = run_git_command(['ls-files'])
    
    sensitive_patterns = [
        ('.env', 'Environment files'),
        ('api-key', 'API key files'),
        ('secret', 'Secret files'), 
        ('credential', 'Credential files'),
        ('.log', 'Log files'),
        ('.sqlite3', 'Database files'),
        ('config.json', 'Configuration files'),
        ('gemini_', 'Gemini-specific files'),
        ('oneagent_', 'OneAgent runtime files'),
        ('test-', 'Test files'),
        ('debug-', 'Debug files')
    ]
    
    issues_found = []
    
    for file in tracked_files:
        file_lower = file.lower()
        for pattern, description in sensitive_patterns:
            if pattern in file_lower:
                # Check if it's an acceptable file
                acceptable_files = [
                    '.env.example',
                    'tsconfig.json',        # TypeScript config - legitimate
                    'vite.config.ts',       # Vite config - legitimate  
                    'postcss.config.js',    # PostCSS config - legitimate
                    'tailwind.config.js',   # Tailwind config - legitimate
                    'ui/tsconfig.node.json' # UI TypeScript config - legitimate
                ]
                
                if not any(acceptable in file for acceptable in acceptable_files):
                    issues_found.append((file, description))
    
    if issues_found:
        print("⚠️  POTENTIAL SECURITY ISSUES FOUND:")
        for file, description in issues_found:
            print(f"   📁 {file} ({description})")
        print()
    else:
        print("✅ No sensitive files found in git tracking\n")
    
    return len(issues_found) == 0

def check_gitignore_coverage():
    """Check if .gitignore covers all necessary patterns"""
    print("📋 Validating .gitignore coverage...\n")
    
    required_patterns = [
        '.env',
        '*.log', 
        '*.sqlite3',
        'oneagent_*_memory/',
        'test-*.ts',
        'debug-*.ts',
        '*config.json',
        'temp/',
        'data/'
    ]
    
    try:
        with open('.gitignore', 'r') as f:
            gitignore_content = f.read()
    except FileNotFoundError:
        print("❌ .gitignore file not found!")
        return False
    
    missing_patterns = []
    for pattern in required_patterns:
        if pattern not in gitignore_content:
            missing_patterns.append(pattern)
    
    if missing_patterns:
        print("⚠️  Missing patterns in .gitignore:")
        for pattern in missing_patterns:
            print(f"   📝 {pattern}")
        print()
    else:
        print("✅ All required patterns found in .gitignore\n")
    
    return len(missing_patterns) == 0

def generate_security_report():
    """Generate comprehensive security report"""
    print("=" * 60)
    print("🛡️  ONEAGENT REPOSITORY SECURITY VALIDATION")
    print("=" * 60)
    print()
    
    # Run all checks
    check1 = check_sensitive_patterns()
    check2 = check_gitignore_coverage() 
    
    # Summary
    print("📊 SECURITY VALIDATION SUMMARY:")
    print(f"   ✅ Git tracking security: {'PASS' if check1 else 'FAIL'}")
    print(f"   ✅ .gitignore coverage: {'PASS' if check2 else 'FAIL'}")
    print()
    
    if all([check1, check2]):
        print("🎉 REPOSITORY SECURITY: EXCELLENT")
        print("   All security checks passed. Safe to push to GitHub.")
    else:
        print("⚠️  REPOSITORY SECURITY: NEEDS ATTENTION")
        print("   Please address the issues above before pushing to GitHub.")
    
    print()

if __name__ == "__main__":
    generate_security_report()
