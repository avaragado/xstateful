// @flow
//
// we invoke rollup twice (see package.json):
// once with NODE_ENV unset (defaulting to 'development'),
// once set to 'production'.
// for development, we build umd, cjs, es.
// for production, we build minimised umd.
// we replace NODE_ENV for umd only.

/* ::

type Warning = {
    code: string,
    message: string,
};

*/

import babel from 'rollup-plugin-babel';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import replace from 'rollup-plugin-replace';
import { uglify } from 'rollup-plugin-uglify';

import pkg from './package.json';

const NODE_ENV = process.env.NODE_ENV || 'development';
const PROD = NODE_ENV === 'production';

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

const noThisIsUndefined = (warning /* : Warning */) => {
    // hide an irritating warning that doesn't seem to affect functionality
    // https://github.com/rollup/rollup/wiki/Troubleshooting#this-is-undefined
    if (warning.code === 'THIS_IS_UNDEFINED') {
        return;
    }

    console.error(warning.message); // eslint-disable-line no-console
};

export default [
    {
        input: 'src/index.js',
        external: ['xstate'],
        output: [
            {
                file: PROD ? pkg.browser : pkg.browser.replace('.min.', '.'),
                format: 'umd',
                name: 'XStateful',
                globals: { xstate: 'xstate' },
            },
        ],
        plugins: [
            replace({
                'process.env.NODE_ENV': JSON.stringify(NODE_ENV),
            }),
            babel(babelConfig),
            resolve(),
            commonjs(),
            PROD && uglify(),
        ],

        onwarn: noThisIsUndefined,
    },

    !PROD && {
        input: 'src/index.js',
        external: ['xstate'],
        output: [
            { file: pkg.main, format: 'cjs' },
            { file: pkg.module, format: 'es' },
        ],
        plugins: [babel(babelConfig), resolve(), commonjs()],

        onwarn: noThisIsUndefined,
    },
].filter(Boolean);
