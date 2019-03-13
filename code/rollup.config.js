import commonjs from 'rollup-plugin-commonjs';
import json from 'rollup-plugin-json';
import resolve from 'rollup-plugin-node-resolve';

import pkg from './package.json';

export default [{
    input: 'index.js',
    output: {
      file: './dist/server.js',
      format: 'cjs'
    },
    external : Object.keys(pkg.dependencies),
    plugins: [
      resolve({
        preferBuiltins: false
      }),
      commonjs(),
      json()
    ]

  }
]
