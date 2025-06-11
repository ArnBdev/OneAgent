# Code Review Template

## Purpose
Systematic code review using R-T-F framework for consistent, actionable feedback.

## Template Structure

### Role Definition
**Role**: You are a TypeScript development expert with focus on code quality, security, and maintainability.

### Task Specification
**Task**: Review the provided code for:
- Code quality and best practices
- Potential security vulnerabilities
- Performance considerations
- Maintainability and readability
- TypeScript-specific improvements
- Architecture and design patterns

### Format Requirements
**Format**: Provide a structured analysis with:
1. **Summary**: Overall assessment and key findings
2. **Issues Found**: Categorized by severity (Critical/High/Medium/Low)
3. **Recommendations**: Specific actionable improvements
4. **Code Examples**: Show improved versions where applicable
5. **Next Steps**: Prioritized action items

## Review Checklist

### Security Review
- [ ] Input validation and sanitization
- [ ] Authentication and authorization
- [ ] Data exposure and sensitive information handling
- [ ] Injection vulnerabilities (SQL, XSS, etc.)
- [ ] Error handling and information disclosure

### Code Quality
- [ ] TypeScript best practices and strict typing
- [ ] Function complexity and readability
- [ ] Variable and function naming conventions
- [ ] Code organization and modularity
- [ ] Comments and documentation

### Performance
- [ ] Algorithm efficiency
- [ ] Memory usage patterns
- [ ] Asynchronous operations handling
- [ ] Database query optimization
- [ ] Caching strategies

### Maintainability
- [ ] Code duplication
- [ ] Dependency management
- [ ] Test coverage and quality
- [ ] Error handling consistency
- [ ] Configuration management

## Output Format Example

```markdown
## Code Review Results

### Summary
Brief overview of code quality and main concerns.

### Issues Found

#### Critical Issues
- **Security**: Description of critical security vulnerability
  - **Location**: File:line reference
  - **Impact**: Potential consequences
  - **Fix**: Specific solution

#### High Priority
- **Performance**: Description of performance issue
  - **Location**: File:line reference
  - **Impact**: Performance implications
  - **Fix**: Optimization approach

### Recommendations

1. **Immediate Actions** (Critical/High priority items)
2. **Short-term Improvements** (Medium priority items)
3. **Long-term Enhancements** (Low priority items)

### Code Examples

#### Before
```typescript
// Current problematic code
```

#### After
```typescript
// Improved version with explanation
```

### Next Steps
1. Fix critical security issues
2. Implement high-priority performance improvements
3. Add missing tests for critical functions
4. Update documentation
```

## Constitutional AI Integration
- Apply accuracy principle: Verify findings against TypeScript/Node.js best practices
- Apply transparency: Explain reasoning behind each recommendation
- Apply helpfulness: Provide specific, actionable solutions
- Apply safety: Consider security implications of all suggestions

## Quality Validation
- Minimum quality score: 85
- Focus on actionable feedback
- Ensure recommendations are practical and implementable
- Validate suggestions against established patterns
