import { isFunction } from "./utils"
import { observe } from "./observer/index"









export function initState(vm){
  const opts = vm.$options
  if ( opts.data ) {
    initData(vm)
  }
}

function initData(vm) {
  
  let data = vm.$options.data

  data = vm._data =isFunction(data) ? data.call(vm) : data
  
  // 把data上的属性代理到vm上
  for(let key in data){
    proxy(vm, '_data', key)
  }
  observe(data)
}


function proxy(vm, source, key){
  Object.defineProperty(vm, key, {
    get(){
      return vm[source][key]
    },
    set(newVal){
      vm[source][key] = newVal
    }
  })
}


