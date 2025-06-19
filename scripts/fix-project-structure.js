#!/usr/bin/env node

/**
 * OneAgent Project Structure Auto-Fixer
 * Automatically moves files to their correct locations
 */

const fs = require('fs');
const path = require('path');
const ProjectStructureValidator = require('./validate-project-structure.js');

class ProjectStructureFixer {
  constructor() {
    this.rootPath = process.cwd();
    this.validator = new ProjectStructureValidator();
    this.moveCount = 0;
  }

  /**
   * Fix all structure violations automatically
   */
  async fix() {
    console.log('🔧 Auto-fixing OneAgent project structure...\n');
    
    // First validate to get violations
    this.validator.validate();
    
    if (this.validator.violations.length === 0) {
      console.log('✅ No violations found - project structure is correct!');
      return true;
    }

    console.log(`Found ${this.validator.violations.length} violations to fix...\n`);

    // Process each violation
    for (const violation of this.validator.violations) {
      await this.fixViolation(violation);
    }

    // Validate again to confirm fixes
    console.log('\n🔍 Re-validating after fixes...');
    const validator2 = new ProjectStructureValidator();
    const isFixed = validator2.validate();

    if (isFixed) {
      console.log(`\n🎉 Successfully fixed ${this.moveCount} files!`);
    } else {
      console.log('\n⚠️  Some issues remain - manual review may be needed.');
    }

    return isFixed;
  }

  /**
   * Fix a specific violation
   */
  async fixViolation(violation) {
    const { file, suggestion } = violation;
    
    if (!suggestion || suggestion.includes('unknown')) {
      console.log(`⏭️  Skipping ${file} - requires manual review`);
      return;
    }

    try {
      const sourcePath = path.resolve(this.rootPath, file);
      const targetPath = path.resolve(this.rootPath, suggestion);
      const targetDir = path.dirname(targetPath);

      // Ensure target directory exists
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
        console.log(`📁 Created directory: ${path.relative(this.rootPath, targetDir)}`);
      }

      // Check if target file already exists
      if (fs.existsSync(targetPath)) {
        console.log(`⚠️  Target exists: ${suggestion} - skipping ${file}`);
        return;
      }

      // Move the file
      fs.renameSync(sourcePath, targetPath);
      console.log(`✅ Moved: ${file} → ${suggestion}`);
      this.moveCount++;

    } catch (error) {
      console.error(`❌ Failed to move ${file}: ${error.message}`);
    }
  }

  /**
   * Interactive mode - ask before each move
   */
  async fixInteractive() {
    console.log('🔧 Interactive project structure fixing...\n');
    
    this.validator.validate();
    
    if (this.validator.violations.length === 0) {
      console.log('✅ No violations found!');
      return true;
    }

    for (const violation of this.validator.violations) {
      const answer = await this.askUser(`Move ${violation.file} → ${violation.suggestion}? (y/n/s=skip): `);
      
      if (answer.toLowerCase() === 'y') {
        await this.fixViolation(violation);
      } else if (answer.toLowerCase() === 's') {
        console.log(`⏭️  Skipped: ${violation.file}`);
      } else {
        console.log(`❌ Cancelled: ${violation.file}`);
      }
    }

    return true;
  }

  /**
   * Ask user for input (simple implementation)
   */
  askUser(question) {
    return new Promise((resolve) => {
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      rl.question(question, (answer) => {
        rl.close();
        resolve(answer);
      });
    });
  }

  /**
   * Dry run - show what would be moved without actually moving
   */
  dryRun() {
    console.log('🔍 Dry run - showing what would be moved...\n');
    
    this.validator.validate();
    
    if (this.validator.violations.length === 0) {
      console.log('✅ No violations found!');
      return;
    }

    console.log('📋 PLANNED MOVES:\n');
    this.validator.violations.forEach((violation, index) => {
      console.log(`${index + 1}. ${violation.file}`);
      console.log(`   → ${violation.suggestion}`);
      console.log(`   Reason: ${violation.type} (${violation.severity})`);
      console.log('');
    });

    console.log(`\n📊 Total files to move: ${this.validator.violations.length}`);
    console.log('\n💡 To execute: npm run fix-structure');
  }
}

// CLI execution
if (require.main === module) {
  const fixer = new ProjectStructureFixer();
  const mode = process.argv[2];

  switch (mode) {
    case '--dry-run':
    case '-d':
      fixer.dryRun();
      break;
    case '--interactive':
    case '-i':
      fixer.fixInteractive();
      break;
    default:
      fixer.fix();
      break;
  }
}

module.exports = ProjectStructureFixer;
