#!/usr/bin/env node
/**
 * Structure Enforcement Script
 * Automatically ensures all new files are created in correct locations
 * and provides immediate feedback for proper file placement
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Enhanced file placement rules with automatic suggestions
const placementRules = {
  // Test files
  'test-*.ts': {
    correctLocation: 'tests/',
    description: 'Test files',
    example: 'tests/test-new-feature.ts',
    template: 'test'
  },
  '*.test.ts': {
    correctLocation: 'tests/',
    description: 'Unit test files',
    example: 'tests/component.test.ts',
    template: 'test'
  },
  '*Test.ts': {
    correctLocation: 'tests/',
    description: 'Test class files',
    example: 'tests/apiTest.ts',
    template: 'test'
  },
  
  // Documentation files
  '*GUIDE*.md': {
    correctLocation: 'docs/',
    description: 'Guide documentation',
    example: 'docs/SETUP_GUIDE.md',
    template: 'doc'
  },
  '*REFERENCE*.md': {
    correctLocation: 'docs/',
    description: 'Reference documentation',
    example: 'docs/API_REFERENCE.md',
    template: 'doc'
  },
  '*DOCUMENTATION*.md': {
    correctLocation: 'docs/',
    description: 'Technical documentation',
    example: 'docs/FEATURE_DOCUMENTATION.md',
    template: 'doc'
  },
  '*IMPLEMENTATION*.md': {
    correctLocation: 'docs/',
    description: 'Implementation details',
    example: 'docs/AUTH_IMPLEMENTATION.md',
    template: 'doc'
  },
  
  // Script files
  'build*.js': {
    correctLocation: 'scripts/',
    description: 'Build scripts',
    example: 'scripts/build-production.js',
    template: 'script'
  },
  'deploy*.js': {
    correctLocation: 'scripts/',
    description: 'Deployment scripts',
    example: 'scripts/deploy-staging.js',
    template: 'script'
  },
  '*-util*.js': {
    correctLocation: 'scripts/',
    description: 'Utility scripts',
    example: 'scripts/db-utils.js',
    template: 'script'
  },
  
  // Debug and log files
  '*.log': {
    correctLocation: 'temp/',
    description: 'Log files',
    example: 'temp/debug.log',
    autoMove: true
  },
  'debug*.txt': {
    correctLocation: 'temp/',
    description: 'Debug output',
    example: 'temp/debug-output.txt',
    autoMove: true
  },
  '*.tmp': {
    correctLocation: 'temp/',
    description: 'Temporary files',
    example: 'temp/cache.tmp',
    autoMove: true
  }
};

function matchesPattern(filename, pattern) {
  const regex = new RegExp(pattern.replace(/\*/g, '.*'), 'i');
  return regex.test(filename);
}

function suggestCorrectPlacement(filename) {
  for (const [pattern, rule] of Object.entries(placementRules)) {
    if (matchesPattern(filename, pattern)) {
      return rule;
    }
  }
  
  // Default suggestions based on file extension
  const ext = path.extname(filename).toLowerCase();
  if (ext === '.md' && filename !== 'README.md') {
    return {
      correctLocation: 'docs/',
      description: 'Documentation file',
      example: `docs/${filename}`,
      template: 'doc'
    };
  }
  
  if (ext === '.ts' && filename.includes('test')) {
    return {
      correctLocation: 'tests/',
      description: 'Test file',
      example: `tests/${filename}`,
      template: 'test'
    };
  }
  
  if (ext === '.js' && (filename.includes('build') || filename.includes('script'))) {
    return {
      correctLocation: 'scripts/',
      description: 'Script file',
      example: `scripts/${filename}`,
      template: 'script'
    };
  }
  
  return null;
}

function autoMoveFile(filename, suggestion) {
  const sourcePath = filename;
  const targetDir = suggestion.correctLocation;
  const targetPath = path.join(targetDir, filename);
  
  try {
    // Ensure target directory exists
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
      log(`📁 Created directory: ${targetDir}`, 'blue');
    }
    
    // Move the file
    fs.renameSync(sourcePath, targetPath);
    log(`✅ Auto-moved: ${sourcePath} → ${targetPath}`, 'green');
    
    return true;
  } catch (error) {
    log(`❌ Failed to move ${sourcePath}: ${error.message}`, 'red');
    return false;
  }
}

function createFileInCorrectLocation(filename, suggestion) {
  const targetDir = suggestion.correctLocation;
  const targetPath = path.join(targetDir, filename);
  
  if (fs.existsSync(targetPath)) {
    log(`⚠️  File already exists: ${targetPath}`, 'yellow');
    return false;
  }
  
  try {
    // Use our existing create utility if template is available
    if (suggestion.template) {
      const templateName = path.parse(filename).name;
      const command = `node scripts/dev-utils.js create ${suggestion.template} ${templateName}`;
      
      log(`🔧 Creating ${suggestion.description} with template...`, 'cyan');
      execSync(command, { stdio: 'inherit' });
      return true;
    }
    
    // Create basic file
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    fs.writeFileSync(targetPath, `# ${filename}\n\nCreated: ${new Date().toISOString()}\n`);
    log(`✅ Created: ${targetPath}`, 'green');
    return true;
    
  } catch (error) {
    log(`❌ Failed to create ${targetPath}: ${error.message}`, 'red');
    return false;
  }
}

function scanForMisplacedFiles() {
  log('🔍 Scanning for misplaced files...', 'cyan');
  
  const rootFiles = fs.readdirSync('.')
    .filter(f => fs.statSync(f).isFile())
    .filter(f => !['package.json', 'tsconfig.json', '.gitignore', '.env.example', 'README.md', 'LICENSE'].includes(f));
  
  let issuesFound = 0;
  
  for (const filename of rootFiles) {
    const suggestion = suggestCorrectPlacement(filename);
    
    if (suggestion) {
      log(`\n📋 File: ${filename}`, 'yellow');
      log(`   Should be: ${suggestion.correctLocation}${filename}`, 'blue');
      log(`   Type: ${suggestion.description}`, 'blue');
      
      if (suggestion.autoMove) {
        if (autoMoveFile(filename, suggestion)) {
          log(`   ✅ Automatically moved to correct location`, 'green');
        } else {
          issuesFound++;
        }
      } else {
        log(`   💡 Run: mv ${filename} ${suggestion.correctLocation}`, 'cyan');
        if (suggestion.template) {
          log(`   🎯 Or use: npm run new:${suggestion.template} ${path.parse(filename).name}`, 'cyan');
        }
        issuesFound++;
      }
    }
  }
  
  if (issuesFound === 0) {
    log('\n✅ All files are in correct locations!', 'green');
  } else {
    log(`\n⚠️  Found ${issuesFound} files that should be moved`, 'yellow');
  }
  
  return issuesFound;
}

function showFileCreationGuide() {
  log('\n📋 Quick File Creation Guide', 'cyan');
  log('=' .repeat(40), 'cyan');
  
  const guides = [
    {
      type: '📝 Documentation',
      command: 'npm run new:doc <name>',
      example: 'npm run new:doc deployment-guide',
      location: 'docs/'
    },
    {
      type: '🧪 Test Files', 
      command: 'npm run new:test <name>',
      example: 'npm run new:test api-validation',
      location: 'tests/'
    },
    {
      type: '🔧 Scripts',
      command: 'npm run new:script <name>',
      example: 'npm run new:script build-staging',
      location: 'scripts/'
    },
    {
      type: '📁 Temporary Files',
      note: 'Create directly in temp/ - these are gitignored',
      location: 'temp/'
    }
  ];
  
  guides.forEach(guide => {
    log(`\n${guide.type}:`, 'magenta');
    log(`  Location: ${guide.location}`, 'blue');
    if (guide.command) {
      log(`  Command:  ${guide.command}`, 'green');
      log(`  Example:  ${guide.example}`, 'cyan');
    }
    if (guide.note) {
      log(`  Note:     ${guide.note}`, 'yellow');
    }
  });
  
  log('\n💡 This ensures files are created in correct locations with proper templates!', 'blue');
}

function interactiveFileCreation() {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  log('\n🎯 Interactive File Creation', 'cyan');
  log('What type of file do you want to create?', 'blue');
  log('1. Documentation (docs/)', 'green');
  log('2. Test file (tests/)', 'green');  
  log('3. Script (scripts/)', 'green');
  log('4. Cancel', 'yellow');
  
  rl.question('\nEnter choice (1-4): ', (choice) => {
    switch(choice) {
      case '1':
        rl.question('Documentation name: ', (name) => {
          execSync(`npm run new:doc ${name}`, { stdio: 'inherit' });
          rl.close();
        });
        break;
      case '2':
        rl.question('Test name: ', (name) => {
          execSync(`npm run new:test ${name}`, { stdio: 'inherit' });
          rl.close();
        });
        break;
      case '3':
        rl.question('Script name: ', (name) => {
          execSync(`npm run new:script ${name}`, { stdio: 'inherit' });
          rl.close();
        });
        break;
      default:
        log('👋 Cancelled', 'yellow');
        rl.close();
    }
  });
}

// Command handling
const command = process.argv[2];

switch(command) {
  case 'scan':
    scanForMisplacedFiles();
    break;
  case 'guide':
    showFileCreationGuide();
    break;
  case 'create':
    interactiveFileCreation();
    break;
  case 'check':
    const issues = scanForMisplacedFiles();
    process.exit(issues > 0 ? 1 : 0);
    break;
  default:
    log('🏗️  OneAgent Structure Enforcement', 'cyan');
    log('=' .repeat(40), 'cyan');
    log('\nUsage:', 'blue');
    log('  node scripts/ensure-structure.js scan    # Scan for misplaced files', 'green');
    log('  node scripts/ensure-structure.js guide   # Show file creation guide', 'green');
    log('  node scripts/ensure-structure.js create  # Interactive file creation', 'green');
    log('  node scripts/ensure-structure.js check   # Check structure (CI-friendly)', 'green');
    log('\n💡 This script helps maintain proper project organization!', 'blue');
}
