import babel from 'rollup-plugin-babel';

// rollup.config.js
export default {
    input: 'photon-timeseries-to-c3-worker.js',
    output: {
      file: 'dist/photon-timeseries-to-c3-worker.js',
      format: 'iife'
    },
    plugins: [
      babel({
        exclude: 'node_modules/**',
        presets: [ ["@babel/preset-env", { "modules": false }]],
        runtimeHelpers: true 
      })
    ]
  };