import js from '@eslint/js'
import globals from 'globals'
import pluginVue from 'eslint-plugin-vue'
import prettier from 'eslint-config-prettier'

/** @type {import('eslint').Linter.Config[]} */
export default [
  // Global Ignored files
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.firebase/**',
      '**/firebase-data/**',
    ],
  },

  // Base JS Configuration
  js.configs.recommended,

  // Vue Configuration (Frontend)
  ...pluginVue.configs['flat/essential'],
  {
    files: ['frontend/src/**/*.{vue,js}'],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      // Force multi-line for multiple attributes in Vue templates
      'vue/max-attributes-per-line': [
        'error',
        {
          singleline: 1,
          multiline: 1,
        },
      ],
      'vue/first-attribute-linebreak': [
        'error',
        {
          singleline: 'ignore',
          multiline: 'below',
        },
      ],
      'vue/html-indent': ['error', 2],
      'vue/html-closing-bracket-newline': [
        'error',
        {
          singleline: 'never',
          multiline: 'always',
        },
      ],
      'vue/html-self-closing': [
        'error',
        {
          html: {
            void: 'always',
            normal: 'always',
            component: 'always',
          },
        },
      ],
      // General JS breaking rules
      'object-curly-newline': ['error', { multiline: true, consistent: true }],
      'array-element-newline': ['error', 'consistent'],
    },
  },

  // Views & Layouts Configuration (Allow single-word page and layout components)
  {
    files: ['frontend/src/views/**/*.vue', 'frontend/src/components/layout/**/*.vue'],
    rules: {
      'vue/multi-word-component-names': 'off',
    },
  },

  // Node.js Configuration (Backend/Functions)
  {
    files: ['backend/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.mocha,
      },
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-console': 'off',
      'prefer-arrow-callback': 'error',
      quotes: ['error', 'single', { allowTemplateLiterals: true }],
    },
  },

  // Prettier Integration (Final override)
  prettier,
]
