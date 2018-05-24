// @flow

import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel';
import pkg from './package.json';

const input = 'src/index.js';

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
    plugins: ['external-helpers'],
    exclude: ['node_modules/**'],
};

export default [
    // browser-friendly UMD build
    {
        input,
        output: {
            file: pkg.browser,
            format: 'umd',
            name: 'XStateRunner',
        },
        plugins: [resolve(), commonjs(), babel(babelConfig)],
    },

    // CommonJS (for Node) and ES module (for bundlers) build.
    // (We could have three entries in the configuration array
    // instead of two, but it's quicker to generate multiple
    // builds from a single configuration where possible, using
    // the `targets` option which can specify `dest` and `format`)
    {
        input,
        external: ['ms'],
        output: [
            { file: pkg.main, format: 'cjs' },
            { file: pkg.module, format: 'es' },
        ],
        plugins: [babel(babelConfig)],
    },
];
