// OneAgent ESLint plugin: custom rules enforcing canonical systems
// - no-parallel-cache: Disallow long-lived Map() usage used as caches across calls
// - prefer-unified-time: Disallow Date.now() for production code (allow in tests and scripts)
// - prefer-unified-id: Disallow Math.random() for IDs in production code

/** @type {import('eslint').Rule.RuleModule} */
const noParallelCacheRule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow long-lived Map()-based caches; use OneAgentUnifiedBackbone.getInstance().cache',
      recommended: true,
    },
    messages: {
      noParallelCache:
        'Avoid long-lived Map() caches. Use unified cache: OneAgentUnifiedBackbone.getInstance().cache.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          allowLocal: { type: 'boolean' },
          allowFilesPattern: { type: 'string' },
        },
        additionalProperties: false,
      },
    ],
  },
  create(context) {
    const options = context.options?.[0] || {};
    const allowLocal = options.allowLocal !== false; // default true: allow function-local ephemeral maps
    const allowFilesPattern = options.allowFilesPattern
      ? new RegExp(options.allowFilesPattern)
      : /(tests|scripts|ui)\//;

    function isFunctionLocalMap(node) {
      // Consider const foo = new Map() declared within a function block as local
      let parent = node.parent;
      while (parent) {
        if (
          parent.type === 'FunctionDeclaration' ||
          parent.type === 'FunctionExpression' ||
          parent.type === 'ArrowFunctionExpression' ||
          parent.type === 'MethodDefinition'
        ) {
          return true;
        }
        if (parent.type === 'Program' || parent.type === 'ClassBody') return false;
        parent = parent.parent;
      }
      return false;
    }

    return {
      NewExpression(node) {
        if (node.callee && node.callee.type === 'Identifier' && node.callee.name === 'Map') {
          const filename = context.getFilename().replace(/\\/g, '/');
          if (allowFilesPattern.test(filename)) return; // allow in tests/scripts/ui

          const isLocal = isFunctionLocalMap(node);
          if (allowLocal && isLocal) return;

          // If part of a class or module-level variable, flag it
          let p = node.parent;
          while (p && p.type !== 'Program') {
            if (
              p.type === 'ClassProperty' ||
              p.type === 'PropertyDefinition' ||
              p.type === 'VariableDeclarator'
            ) {
              context.report({ node, messageId: 'noParallelCache' });
              return;
            }
            p = p.parent;
          }
          // Fallback: if at top-level, report as well
          if (p && p.type === 'Program') {
            context.report({ node, messageId: 'noParallelCache' });
          }
        }
      },
    };
  },
};

/** @type {import('eslint').Rule.RuleModule} */
const preferUnifiedTimeRule = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Use createUnifiedTimestamp() instead of Date.now() in production TS',
      recommended: true,
    },
    messages: {
      useUnifiedTime:
        'Use createUnifiedTimestamp() from UnifiedBackboneService instead of Date.now().',
    },
    schema: [],
  },
  create(context) {
    const filename = context.getFilename().replace(/\\/g, '/');
    const isAllowed = /(tests|scripts|ui)\//.test(filename);
    return {
      CallExpression(node) {
        if (isAllowed) return;
        if (node.callee && node.callee.type === 'MemberExpression') {
          const obj = node.callee.object;
          const prop = node.callee.property;
          if (
            obj &&
            prop &&
            obj.type === 'Identifier' &&
            obj.name === 'Date' &&
            ((prop.type === 'Identifier' && prop.name === 'now') ||
              (prop.type === 'Literal' && prop.value === 'now'))
          ) {
            context.report({ node, messageId: 'useUnifiedTime' });
          }
        }
      },
    };
  },
};

/** @type {import('eslint').Rule.RuleModule} */
const preferUnifiedIdRule = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Use createUnifiedId() instead of Math.random() for IDs in production TS',
      recommended: true,
    },
    messages: {
      useUnifiedId:
        'Use createUnifiedId() from UnifiedBackboneService instead of Math.random() for identifiers.',
    },
    schema: [],
  },
  create(context) {
    const filename = context.getFilename().replace(/\\/g, '/');
    const isAllowed = /(tests|scripts|ui)\//.test(filename);
    return {
      CallExpression(node) {
        if (isAllowed) return;
        if (node.callee && node.callee.type === 'MemberExpression') {
          const obj = node.callee.object;
          const prop = node.callee.property;
          if (
            obj &&
            prop &&
            obj.type === 'Identifier' &&
            obj.name === 'Math' &&
            ((prop.type === 'Identifier' && prop.name === 'random') ||
              (prop.type === 'Literal' && prop.value === 'random'))
          ) {
            context.report({ node, messageId: 'useUnifiedId' });
          }
        }
      },
    };
  },
};

module.exports = {
  rules: {
    'no-parallel-cache': noParallelCacheRule,
    'prefer-unified-time': preferUnifiedTimeRule,
    'prefer-unified-id': preferUnifiedIdRule,
  },
};
