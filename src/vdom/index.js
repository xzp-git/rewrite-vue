export function createElementVNode(vm, tag, data={}, ...children) {
  if (!data) {
    data ={}
  }
  let key =  data.key
  if (key) {
    delete data.key
  }
  return vnode(vm, tag, key, data, children)
}

export function createTextVNode(vm, text) {
  return vnode(vm, undefined, undefined, undefined, undefined,text)
}


function vnode(vm, tag, key, data, children, text) {
  return{
    vm,
    tag,
    key,
    data,
    children,
    text
  }
}

export function isSameVnode(vnode1, vnode2) {
  return vnode1.tag === vnode2.tag && vnode1.key === vnode2.key
}