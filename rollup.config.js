import {babel} from '@rollup/plugin-babel'
import {nodeResolve} from '@rollup/plugin-node-resolve'
const path = require('path')
console.log(path.resolve(__dirname,'public/index.html'));

export default {
  input:'./src/index.js',
  output:{
    file:'./dist/vue.js',
    name:'Vue',
    format:'umd',
    sourcemap:true
  },
  plugins:[
    babel({
      exclude:'node_modules/**',
      presets: ['@babel/preset-env']
    }),
    nodeResolve()
  ]
}