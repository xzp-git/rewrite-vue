import {observe} from './observe'

export  function initState(vm) {
  const opts = vm.$options
  // if (opts.props) {
  //   initProps(opts.props)
  // }

  if (opts.data) {
    initData(vm)
  }
}


function initData(vm) {
  let data = vm.$options.data
  data = typeof data === 'function'? data.call(vm) : data
  vm._data = data
  proxy(vm, '_data')
  observe(data)
} 


function proxy(vm, target){
  for(let key in vm[target]){
      Object.defineProperty(vm, key, {
          get(){
              return vm[target][key]
          },
          set(newValue){
              vm[target][key] = newValue
          }
      })
  }
}