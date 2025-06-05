# OneAgent Project Organization

This document explains the organized project structure and file placement guidelines for OneAgent.

## 📁 Directory Structure

```
OneAgent/
├── 📚 docs/                        # All documentation
│   ├── README.md                   # Main project documentation
│   ├── QUICK_REFERENCE.md          # API quick reference  
│   └── EMBEDDINGS_IMPLEMENTATION.md # Technical details
│
├── 🧪 tests/                       # All test files
│   ├── README.md                   # Testing documentation
│   ├── test-real-api.ts           # Full API integration tests
│   ├── test-api-key.ts            # API key validation
│   ├── test-import.ts             # Module import tests
│   └── test-*.ts                  # Additional test files
│
├── 🔧 scripts/                     # Build and utility scripts
│   ├── README.md                   # Scripts documentation
│   └── dev-utils.js               # Development utilities
│
├── 📁 temp/                        # Temporary files (gitignored)
│   └── README.md                   # Usage guidelines
│
├── 🤖 coreagent/                   # Core application code
│   ├── main.ts                    # Entry point
│   ├── tools/                     # AI tools and clients
│   ├── types/                     # TypeScript definitions
│   └── mcp/                       # Model Context Protocol
│
├── 💾 data/                        # Application data (gitignored)
│   └── workflows/                 # Workflow configurations
│
└── 📋 [Root Files]                 # Essential config files only
    ├── package.json               # Project configuration
    ├── tsconfig.json              # TypeScript settings
    ├── .gitignore                 # Git exclusions
    ├── .env.example               # Environment template
    └── README.md                  # Project overview
```

## 🎯 File Placement Guidelines

### ✅ **Documentation** → `docs/`
- **All .md files** (except root README.md)
- **API documentation**
- **Implementation guides**  
- **User manuals**

### ✅ **Tests** → `tests/`
- **All test-*.ts files**
- **Unit tests**
- **Integration tests**
- **API validation tests**

### ✅ **Scripts** → `scripts/`
- **Build scripts**
- **Deployment utilities**
- **Development helpers**
- **Maintenance tools**

### ✅ **Temporary Files** → `temp/`
- **Build artifacts** (temporary)
- **Cache files**
- **Debug output**
- **Downloaded test files**
- **Anything disposable**

### ✅ **Source Code** → `coreagent/`
- **Application logic**
- **AI tools and clients**
- **Type definitions**
- **Core functionality**

### ✅ **Data** → `data/` (gitignored)
- **Workflow configurations**
- **User data**
- **Personal information**
- **API response cache**

### ✅ **Root Directory** → Essential files only
- **package.json** - Project configuration
- **tsconfig.json** - TypeScript settings
- **README.md** - Project overview
- **.gitignore** - Git exclusions
- **.env.example** - Environment template
- **LICENSE** - Project license

## 🔒 Security & Privacy

### **Gitignored Directories**
- `temp/` - Temporary files and build artifacts
- `data/` - Personal data and configurations
- `.env` - Environment variables with API keys
- `node_modules/` - Dependencies
- `dist/` - Build output

### **Protected Files**
Files that should **NEVER** be committed:
- `.env` - Contains real API keys
- `data/**` - Personal workflow data
- `temp/**` - Temporary build artifacts
- Any files with real API keys or personal information

### **Safe to Commit**
- All `docs/` content
- All `tests/` content  
- All `scripts/` content
- All `coreagent/` source code
- Configuration templates (.env.example)

## 🚀 Development Workflow

### **Daily Development**
```bash
npm run clean        # Clean temporary files
npm run build        # Build TypeScript
npm run test:api     # Test API integration
npm run dev          # Start development mode
```

### **Adding New Features**
1. **Code** → Place in `coreagent/`
2. **Tests** → Place in `tests/`
3. **Documentation** → Place in `docs/`
4. **Scripts** → Place in `scripts/` if needed

### **Before Committing**
```bash
npm run test         # Run all tests
npm run build        # Verify build works
npm run clean        # Clean temporary files
```

## 📋 File Naming Conventions

### **Tests**
- `test-*.ts` - All test files
- `test-real-api.ts` - Full API integration
- `test-api-key.ts` - API key validation
- `test-import.ts` - Module import testing

### **Documentation**
- `README.md` - Main documentation for each directory
- `QUICK_REFERENCE.md` - API and usage reference
- `IMPLEMENTATION.md` - Technical implementation details

### **Scripts**  
- `dev-utils.js` - Development utilities
- `build-*.js` - Build-related scripts
- `deploy-*.js` - Deployment scripts

## ✅ Benefits of This Organization

1. **🔍 Easy to Find** - Logical grouping by purpose
2. **🔒 Security** - Clear separation of sensitive data
3. **🧹 Clean Root** - No clutter in main directory
4. **📚 Documentation** - Centralized and organized
5. **🧪 Testing** - All tests in one place
6. **🔧 Maintenance** - Utility scripts organized
7. **👥 Team-Friendly** - Clear conventions for collaboration

## 🔄 Migration Summary

**Moved:**
- `*.md` → `docs/` (except README.md)
- `test-*.ts` → `tests/`
- Created `scripts/` with utilities
- Created `temp/` for temporary files

**Updated:**
- Package.json scripts
- Import paths in test files  
- .gitignore for temp directory
- Documentation to reflect new structure

**Result:**
- ✅ Clean, professional project structure
- ✅ Logical file organization
- ✅ Security-conscious data handling
- ✅ Maintainable and scalable architecture
