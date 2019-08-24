import typescript from 'rollup-plugin-typescript2';
import pkgConfig from './package.json';

export default {
  input: 'src/index.ts',
  output: [
    {
      file: pkgConfig.main,
      format: 'cjs',
      sourcemap: true,
    },
    {
      file: pkgConfig.module,
      format: 'esm',
      sourcemap: true,
    },
  ],
  external: [
    ...Object.keys(pkgConfig.dependencies || {}),
    ...Object.keys(pkgConfig.peerDependencies || {}),
    'rxjs/operators',
  ],
  plugins: [
    typescript({
      tsconfig: 'tsconfig.prod.json',
      typescript: require('typescript'),
    }),
  ],
};
