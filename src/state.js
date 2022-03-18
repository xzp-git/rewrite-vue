import {observe} from './observe'
import Watcher from './observe/watcher'
import Dep from './observe/dep'

export  function initState(vm) {
  const opts = vm.$options
  // if (opts.props) {
  //   initProps(opts.props)
  // }

  if (opts.data) {
    initData(vm)
  }
  if (opts.computed) {
    initComputed(vm)
  }

  if (opts.watch) {
    initWatch(vm)
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


function initComputed(vm) {
  const computed = vm.$options.computed
  const watchers = vm._computedWatchers = {} //计算属性watcher保存到vm上
  for(let key in computed){
    let userDef = computed[key]

    const fn = typeof userDef === 'function' ? userDef : userDef.get

    //如果直接new Watcher 默认就会执行fn
    watchers[key] = new Watcher(vm, fn, {lazy: true})

    defineComputed(vm, key, userDef)
  }
}

function defineComputed(target, key, userDef) {
  //  const getter = typeof userDef === 'function' ? userDef : userDef.get
  const setter = userDef.set|| (() => {})
  Object.defineProperty(target, key, {
    get:createComputedGetter(key),
    set:setter
  })
}

function createComputedGetter(key) {
  
  //我们需要检测是否要执行这个getter
  return function () {
    const watcher = this._computedWatchers[key] 
    if (watcher.dirty) {
      watcher.evaluate()
    }
    if (Dep.target) {
      watcher.depend()
    }
    
    return watcher.value //最后返回的wather上面的值
  }
}


function initWatch(vm) {
  let watch = vm.$options.watch
  for(let key in watch){
    const handler = watch[key]
    if (Array.isArray(handler)) {
      for(let i = 0; i < handler.length; i++){
        createWatcher(vm, key, handler[i])
      }
    }else if (typeof handler === 'object') {
      let hanlderFn = handler.handler
      delete handler.handler
      createWatcher(vm, key, hanlderFn, handler)
    }else{
      createWatcher(vm, key, handler)
    }
  }
}

function createWatcher(vm, key, handler, options={}) {
  if (typeof handler === 'string') {
    handler = vm[handler]
  }
  return vm.$watch(key, handler, options)
}