module.exports = {
    root: true,

    extends: [
        'airbnb',
        'plugin:prettier/recommended',
        'plugin:flowtype/recommended',
        'plugin:jest/recommended',
    ],

    plugins: ['flowtype', 'jest'],

    env: {
        'jest/globals': true,
    },

    // overrides the airbnb ruleset
    rules: {
        // 'max-len': [
        //     'error',
        //     {
        //         'code': 200,
        //         'tabWidth': 4,
        //         'ignoreUrls': true,
        //         'ignoreComments': false,
        //         'ignoreRegExpLiterals': true,
        //         'ignoreStrings': true,
        //         'ignoreTemplateLiterals': true
        //     }
        //   ],
        // 4-space indent
        // 'indent': ['error', 4, { SwitchCase: 1 }],
        // // require space before function opening parenthesis
        // 'space-before-function-paren': ['error', 'always'],
        // // allow console methods
        // 'no-console': 'off',
        // // quote all or no props in an object, disallow mixing
        // 'quote-props': ['error', 'consistent'],
        // // never assign to a fn param, but allow assignment to its props
        // 'no-param-reassign': ['error', { 'props': false }],
        // // allow padded blocks
        // 'padded-blocks': 'off',
        // // enforce braces
        // 'curly': ['error', 'all'],
        // // check that when we import default from our own code, there's a default export
        // 'import/default': 'error',
        // // check that named imports exist in the exports
        // 'import/named': 'error',
        // // check that wildcard imports '* as foo' exist when dereferenced
        // 'import/namespace': 'error',
        // // check that external modules are referenced directly in package.json
        // // as dependencies, devDependencies or optionalDependencies.
        // 'import/no-extraneous-dependencies': ['error', {
        //     'devDependencies': true,
        //     'optionalDependencies': true,
        // }],
        // // disallow use of exported name as name of default import,
        // // as it's likely you missed some brackets.
        // 'import/no-named-as-default': 'error',
        // // allow modules with a single named export
        // 'import/prefer-default-export': 'none',
        // // imports always come first
        // 'import/imports-first': ['error', ''],
        // // disallow use of exported name as property on the default export,
        // // as this is likely to confuse.
        // 'import/no-named-as-default-member': 'error',
        // // ensure imports are in a consistent order:
        // 'import/order': ['error', {
        //     'groups': ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        // }],
        // // must separate imports from rest of code
        // 'import/newline-after-import': 'error',
        // // import must include extensions for all files except these
        // "import/extensions": [
        //     "error",
        //     "always",
        //     {
        //         "js": "never",
        //         "jsx": "never",
        //         "es": "never"
        //     }
        // ],
        // // allow dynamic requires
        // "import/no-dynamic-require": 'off',
        // // allow 'require' anywhere
        // 'global-require': 'off',
        // 'no-underscore-dangle': ['error', {
        //     'allowAfterThis': false,
        //     'allow': [
        //         '__',  // for Ramda's R.__
        //     ],
        // }],
        // 'no-warning-comments': [
        //     'warn', {
        //         'terms': ['::TODO::'],
        //         'location': 'start',
        //     }
        // ],
        // 'generator-star-spacing': ['error', { 'before': true, 'after': true }],
        // 'object-curly-newline': 'off',
        // // jsx-a11y has refactored href-no-hash to anchor-is-valid:
        // // waiting for eslint-config-airbnb to catch up (out-of-date at v15.1.0)
        // 'jsx-a11y/href-no-hash': 'off',
    },

    // add as they're encountered
    globals: {},
};
