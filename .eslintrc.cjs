module.exports = {
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:vue/vue3-recommended',
    ],
    ignorePatterns: [
        '**/*.css',
        '**/*.json',
    ],
    parser: 'vue-eslint-parser',
    parserOptions: {
        parser: '@typescript-eslint/parser',
        sourceType: 'module',
    },
    rules: {
        '@typescript-eslint/no-namespace': 'off',
        'array-bracket-spacing': ['error', 'never'],
        'brace-style': 'error',
        'comma-dangle': ['error', 'always-multiline'],
        'comma-spacing': 'error',
        'curly': ['error', 'all'],
        'eol-last': 'error',
        indent: ['error', 4, {SwitchCase: 1}],
        'no-multi-spaces': 'error',
        'no-param-reassign': 'error',
        'no-trailing-spaces': 'error',
        // Disabled due to incorrect validating global defined types.
        // Instead Typescript already checks this for us.
        'no-undef': 'off',
        'object-curly-spacing': ['error', 'never'],
        quotes: ['error', 'single'],
        semi: ['error', 'always'],
        'sort-imports': 'error',
        'space-before-function-paren': ['error', 'never'],
        'space-in-parens': 'error',
        'space-infix-ops': 'error',
        'space-unary-ops': 'error',
        'spaced-comment': 'error',
        'vue/attributes-order': ['error', {alphabetical: true}],
        'vue/html-indent': ['error', 4],
        'vue/multi-word-component-names': 'off',
    },
};
