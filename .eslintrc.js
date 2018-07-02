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

    rules: {
        // allow console methods
        'no-console': 'off',
    },

    globals: {},
};
