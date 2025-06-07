import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import dts from 'rollup-plugin-dts';

const config = [
  // ESM build
  {
    input: 'src/index.ts',
    output: {
      dir: 'dist',
      format: 'es',
      sourcemap: true,
      entryFileNames: 'index.esm.js',
      chunkFileNames: '[name]-[hash].js'
    },
    external: ['vexflow', 'abcjs', 'opensheetmusicdisplay'],
    plugins: [
      resolve(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
        declarationMap: false
      })
    ]
  },
  // UMD build
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.js',
      format: 'umd',
      name: 'RealtimeMusicNotation',
      sourcemap: true,
      inlineDynamicImports: true,
      globals: {
        vexflow: 'Vex',
        abcjs: 'ABCJS',
        opensheetmusicdisplay: 'opensheetmusicdisplay'
      }
    },
    external: ['vexflow', 'abcjs', 'opensheetmusicdisplay'],
    plugins: [
      resolve(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
        declarationMap: false
      })
    ]
  },
  // Type definitions
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.d.ts',
      format: 'es'
    },
    plugins: [dts()]
  }
];

export default config;