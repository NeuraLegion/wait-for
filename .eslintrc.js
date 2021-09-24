module.exports = {
  root: true,
  env: {
    'node': true,
    'es2020': true,
  },
  plugins: [
    '@typescript-eslint',
    'prettier',
    'import',
  ],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'prettier',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/typescript',
    "plugin:prettier/recommended",
  ],
  settings: {
    'import/resolver': {
      node: {
        paths: ['.']
      }
    },
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx']
    }
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    'project': 'tsconfig.json',
    'tsconfigRootDir': '.',
    'ecmaVersion': 2020,
    'sourceType': 'module',
  },
  overrides: [
    {
      'files': ['**/*.spec.ts', '**/*.test.ts'],
      'env': {
        'jest': true,
      },
      'plugins': ['jest'],
    }
  ],
  reportUnusedDisableDirectives: true,
  rules: {
    // Prettier
    'prettier/prettier': [
      'error',
      {
        'tabWidth': 2,
        'useTabs': false,
        'semi': true,
        'singleQuote': true,
        'trailingComma': 'es5',
        'arrowParens': 'avoid',
        'bracketSpacing': true,
        'printWidth': 180,
        'parser': 'typescript'
      },
      {
        'usePrettierrc': false
      }
    ],
    // TypeScript rules
    '@typescript-eslint/no-unsafe-assignment': 'off',
    '@typescript-eslint/no-unsafe-return': 'off',
    '@typescript-eslint/no-unsafe-call': 'off',
    '@typescript-eslint/no-unsafe-member-access': 'off',
    '@typescript-eslint/restrict-template-expressions': 'off',
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/no-misused-promises': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'error',
    '@typescript-eslint/consistent-type-assertions': [
      'error',
      {
        'assertionStyle': 'as',
        'objectLiteralTypeAssertions': 'allow'
      }
    ],
    '@typescript-eslint/prefer-namespace-keyword': 'error',
    // Inherited from ESLint
    'require-await': 'off',
    '@typescript-eslint/require-await': 'error',
    'no-return-await': 'off',
    '@typescript-eslint/return-await': 'error',
    'semi': 'off',
    '@typescript-eslint/semi': [
      'error',
      'always',
      {
        'omitLastInOneLineBlock': true,
      }
    ],
    '@typescript-eslint/member-delimiter-style': [
      'error',
      {
        'multiline': {
          'delimiter': 'semi',
          'requireLast': true
        },
        'singleline': {
          'delimiter': 'semi',
          'requireLast': false
        }
      }
    ],
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        'varsIgnorePattern': '^_',
        'argsIgnorePattern': '^_',
        'caughtErrorsIgnorePattern': '^_',
        'args': 'after-used',
        'ignoreRestSiblings': true,
        'caughtErrors': 'all',
      }
    ],
    '@typescript-eslint/naming-convention': [
      'error',
      {
        'selector': 'default',
        'format': [
          'camelCase',
          'PascalCase',
          'snake_case'
        ],
        'leadingUnderscore': 'allow'
      },
      {
        'selector': 'variable',
        'format': [
          'camelCase',
          'UPPER_CASE',
          'PascalCase'
        ],
        'leadingUnderscore': 'allow'
      },
      // {
      //   'selector': 'variable',
      //   'filter': {
      //     'regex': '_',
      //     'match': true
      //   },
      //   'format': null,
      //   'leadingUnderscore': 'allow'
      // },
      {
        'selector': 'memberLike',
        'modifiers': [
          'private'
        ],
        'format': [
          'camelCase',
          'UPPER_CASE'
        ],
        'leadingUnderscore': 'allow'
      },
      {
        'selector': 'typeLike',
        'format': [
          'PascalCase',
          'snake_case'
        ],
        'leadingUnderscore': 'allow'
      }
    ],
    'no-unused-expressions': 'off',
    '@typescript-eslint/no-unused-expressions': [
      'error',
      {
        'allowTernary': true
      }
    ],
    'indent': 'off',
    '@typescript-eslint/indent': [
      'error',
      2,
      {
        'ArrayExpression': 1,
        'CallExpression': {
          'arguments': 1
        },
        'FunctionDeclaration': {
          'body': 1,
          'parameters': 1
        },
        'FunctionExpression': {
          'body': 1,
          'parameters': 1
        },
        'ImportDeclaration': 1,
        'MemberExpression': 1,
        'ObjectExpression': 1,
        'SwitchCase': 1,
        'flatTernaryExpressions': true,
        'outerIIFEBody': 1
      }
    ],
    'brace-style': 'off',
    '@typescript-eslint/brace-style': [
      'error',
      '1tbs'
    ],
    'comma-dangle': 'off',
    '@typescript-eslint/comma-dangle': [
      'error',
      {
        'arrays': 'only-multiline',
        'objects': 'only-multiline',
        'imports': 'only-multiline',
        'exports': 'only-multiline',
        'enums':  'only-multiline',
        'functions': 'never'
      }
    ],
    // ESLint rules
    'spaced-comment': 'error',
    'max-len': [
      'error',
      180
    ],
    'no-eval': 'error',
    'eqeqeq': [
      'error',
      'always',
      {'null': 'ignore'}
    ],
    'no-multiple-empty-lines': 'error',
    'one-var': [
      'error',
      'never'
    ],
    'curly': 'error',
    'no-empty': 'error',
  }
}