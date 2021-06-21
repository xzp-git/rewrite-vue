import {popTarget, pushTarget} from './dep'
import {queueWatcher} from './scheduler'
let id = 0 

class Watcher{
  constructor(vm, exprOrFn, cb, options){
    this.vm = vm
    this.exprOrFn = exprOrFn
    this.cb = cb
    this.user = !!options.user
    this.lazy = !!options.lazy
    this.dirty = options.lazy
    this.options = options
    this.id = id++

    if(typeof exprOrFn === 'string'){

    }else{
      this.getter = exprOrFn                                           
    }                                                                                            
    this.deps = []
    this.depsId = new Set()
    this.value = this.lazy? undefined : this.get()
  }
  

  get(){
    pushTarget(this)
    const value = this.getter.call(this.vm)
    popTarget()
    return value
  }

  update(){
    if(this.lazy){
      this.dirty = true
    }else{
      queueWatcher(this)
    }
  }

  addDep(dep){
    let id = dep.id
    if(!this.depsId.has(id)){
      this.depsId.add(id)
      this.deps.push(dep)
      dep.addSub(this)
    }
  }

  depend(){
    let i = this.deps.length
    while(i--){
      this.deps[i].depend()
    }
  }
  run(){
    this.get()
  }

  
}


export default Watcher