// @flow

/* ::

type Warning = {
    code: string,
    message: string,
};

*/

import babel from 'rollup-plugin-babel';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

import pkg from './package.json';

// used for the rollup builds: see .babelrc for the config used by jest.
const babelConfig = {
    babelrc: false,
    presets: [
        [
            'env',
            {
                targets: {
                    browsers: ['last 2 versions', 'safari >= 7'],
                },
                modules: false,
            },
        ],
        'flow',
    ],
    plugins: ['external-helpers', 'transform-object-rest-spread'],
    exclude: ['node_modules/**'],
};

export default [
    // CommonJS (for Node) and ES module (for bundlers) build.
    {
        input: 'src/index.js',
        external: ['xstate'],
        output: [
            { file: pkg.main, format: 'cjs' },
            { file: pkg.module, format: 'es' },
        ],
        plugins: [babel(babelConfig), resolve(), commonjs()],

        onwarn: (warning /* : Warning */) => {
            // hide an irritating warning that doesn't seem to affect functionality
            // https://github.com/rollup/rollup/wiki/Troubleshooting#this-is-undefined
            if (warning.code === 'THIS_IS_UNDEFINED') {
                return;
            }

            console.error(warning.message); // eslint-disable-line no-console
        },
    },
];
