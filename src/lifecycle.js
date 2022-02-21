import { createElementVNode, createTextVNode } from "./vdom"

function createElm(vnode) {
  let {tag, data, children, text} = vnode
  if (typeof tag === 'string') {
    vnode.el = document.createElement(tag)

    patchProps(vnode.el, data)

    children.forEach(child => {
      vnode.el.appendChild(createElm(child))
    })
  }else{
    vnode.el = document.createTextNode(text)
  }
  return vnode.el
}
function patchProps(el, props) {
  for(let key in props){
    if (key === 'style') {
      for(let styleName in props.style){
        el.style[styleName] = props.style[styleName]
      }
    } else {
      el.setAttribute(key, props[key])
    }
  }
}

function patch(oldVnode, vnode) {
  //写的是初渲染流程
  const isRealElement = oldVnode.nodeType
  if (isRealElement) {
    const elm = oldVnode
    const parentElm = elm.parentNode //拿到父元素
    let newElm = createElm(vnode)
    parentElm.insertBefore(newElm, elm.nextSibiling)
    parentElm.removeChild(elm)
  }
}

export function initLifeCycle(Vue) {
  Vue.prototype._update = function (vnode) {
    const vm = this
    const el = vm.$el
    console.log(el, vnode);
    //patch既有初始化的功能 又有更新的公共
    patch(el, vnode)
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
  vm._update(vm._render()) 
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