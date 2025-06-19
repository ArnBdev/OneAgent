#!/bin/sh
# OneAgent pre-commit hook - validates project structure

echo "🔍 Validating project structure..."

# Run structure validation
npm run validate-structure

# Check exit code
if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Project structure validation failed!"
    echo "💡 Run 'npm run fix-structure' to auto-fix violations"
    echo "🔧 Or run 'npm run fix-structure:dry' to preview changes"
    echo ""
    echo "To bypass this check (emergency only):"
    echo "git commit --no-verify -m 'your message'"
    exit 1
fi

echo "✅ Project structure validation passed!"
