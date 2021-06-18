import Watcher from './observer/watcher'
import { patch } from './vdom/patch'




export function lifecycleMixin(Vue){
  Vue.prototype._update = function(vnode){
    const vm = this

    const preVnode = vm._vnode //表示当前的虚拟节点保存起来
    if(!preVnode){
      
      vm.$el =  patch(vm.$el, vnode)
    }else{
      vm.$el =  patch(preVnode, vnode)
    }
    vm._vnode = vnode
    
    
  }
  // Vue.prototype.$nextTick = nextTick
}





 export function mountComponent(vm, el){
   let updateComponent = () => {
     
     vm._update(vm._render())
   }

   new Watcher(vm, updateComponent,()=> {
     console.log('更新视图')
   }, true)
 }