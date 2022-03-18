import { nextTick } from "../utils"
import Dep, { popTarget, pushTarget } from "./dep"

let id = 0

class Watcher{
  constructor(vm, exprOrFn, options, cb){
    this.vm = vm
    this.id = id++
    this.renderWatcher = options
    this.getter = typeof exprOrFn === 'string'? ()=>vm[exprOrFn] : exprOrFn//getter意味着调用这个函数可以发生取值操作
    this.deps = []
    this.depsId = new Set()
    this.lazy = options.lazy
    this.dirty = this.lazy
    this.cb = cb
    this.immediate = options.immediate
    this.user = options.user

    this.value = this.lazy? undefined : this.get()
    this.immediate?this.cb(this.value, undefined) : undefined
  }

  addDep(dep){
    let id = dep.id

    if (!this.depsId.has(id)) {
      this.depsId.add(id)
      this.deps.push(dep)
      dep.addSub(this)
    }
  }
  depend(){
    let i = this.deps.length
    while (i--) {
      this.deps[i].depend()
    }
  }
  evaluate(){
    this.value = this.get() //获取到用户函数的返回值 并且还要标识为脏
    this.dirty = false
  }
  get(){
    pushTarget(this)
    let value = this.getter.call(this.vm)
    popTarget()
    return value
  }
  update(){
    if (this.lazy) {
      //如果是计算属性 依赖的值变化了 就标识计算属性是脏值了
      this.dirty = true
    }else{
      queueWatcher(this)
    }
  }
  run(){
    let oldValue = this.value
    let newValue = this.get()
    if (this.user) {
      this.cb.call(this.vm, newValue, oldValue)
    }
  }
}


let queue = []
let has = {}
let pending = false

function flushSchedulerQueue() {
  let flushQueue = queue.slice(0)
  queue = []
  has = {}
  pending = false
  flushQueue.forEach(q => q.run())
}

function queueWatcher(watcher) {
  const id = watcher.id
  if (!has[id]) {
    queue.push(watcher)
    has[id] = true
    if (!pending) {
      pending = true
      nextTick(flushSchedulerQueue)
    }
  }
}



export default Watcher