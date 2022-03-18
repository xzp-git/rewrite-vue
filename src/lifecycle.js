import Watcher from "./observe/watcher"
import { createElementVNode, createTextVNode } from "./vdom"
import { patch } from "./vdom/patch"



export function initLifeCycle(Vue) {
  Vue.prototype._update = function (vnode) {
    const vm = this
    const el = vm.$el
    //patch既有初始化的功能 又有更新的公共
    const newEl = patch(el, vnode)
    vm.$el = newEl
  }

  Vue.prototype._c = function () {
    return createElementVNode(this, ...arguments)
  }
  Vue.prototype._v = function () {
    return createTextVNode(this, ...arguments)
  }
  Vue.prototype._s = function (value) {
    if(typeof value === 'object') return JSON.stringify(value)
    return value
  }

  Vue.prototype._render = function () {
    const vm = this
    return vm.$options.render.call(vm) 
  }
}

export function mountComponent(vm, el) {
  vm.$el = el
  //1.调用render方法产生虚拟节点 虚拟Dom

  const updateComponent = () => {
    vm._update(vm._render())
  }

  new Watcher(vm, updateComponent, true)
  //2.根据虚拟DOM产生真实DOM

  //3.插入到el元素中
}



//vue核心流程
/**
 * 1. 创造了响应式数据 
 * 2. 模板转换成ast语法树
 * 3. 将ast语法树转换成了render函数
 * 4. 后续每次数据更新可以只执行render函数（无需再次执行ast转换的过程）
 * 5. render函数会生成虚拟DOm
 * 6. 根据生成的虚拟节点创造真实的DOM
 */


export function callHook(vm, hook) {
  const handlers = vm.$options[hook]
  if (handlers) {
    handlers.forEach(handler => handler.call(vm))
  }
}