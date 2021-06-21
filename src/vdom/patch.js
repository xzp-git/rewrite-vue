

export function patch(oldVnode,vnode){
  if(!oldVnode){
    return createElm(vnode)
  }

  if(oldVnode.nodeType == 1){
    const parentElm = oldVnode.parentNode

    let elm = createElm(vnode)
    parentElm.insertBefore(elm, oldVnode.nextSibling)
    parentElm.removeChild(oldVnode)
    return elm
  }else{
    const parentElm = oldVnode.el.parentNode

    let elm = createElm(vnode)
    parentElm.insertBefore(elm, oldVnode.el.nextSibling)
    parentElm.removeChild(oldVnode.el)
    return elm



    if(oldVnode.tag !== vnode.tag){
      return oldVnode.el.parentNode.replaceChild(createElm(vnode),oldVnode.el)
    }
    let el = vnode.el = oldVnode.el

    if(vnode.tag == undefined){
      if(oldVnode.text!==vnode.text){
        return el.textCount = vnode.text
      }
    }
    // 如果标签一样比较属性
    let oldProps = oldVnode.data
    patchProps(vnode, oldProps)
    // 属性可能有删除的情况

    let oldChildren = oldVnode.children || []
    let newChildren = vnode.children || []
    if(oldChildren.length > 0 && newChildren.length > 0){
      patchChildren(el,oldChildren, newChildren)
    }else if(newChildren.length > 0){
      for(let i = 0; i < newChildren.length; i++){
        const child = createElm(newChildren[i])
        el.appendChild(child)
      }
    }else if(oldChildren.length > 0){
      el.innerHTML = ``
    }
    return el
  }
}
function isSameVnode(oldVnode,newVnode){
  return (oldVnode.tag == newVnode.tag) && (oldVnode.key == newVnode.key)
}
function patchChildren(el, oldChildren, newChildren){
  let oldStartIndex = 0
  let oldStartVnode = oldChildren[0]
  let oldEndIndex = oldChildren.length - 1
  let oldEndVnode = oldChildren[oldEndIndex] 

  let newStartIndex = 0
  let newStartVnode = newChildren[0]
  let newEndIndex = newChildren.length - 1
  let newEndVnode = newChildren[oldEndIndex] 
  
  while(oldStartIndex <= oldEndIndex && newStartIndex <= newEndIndex){
    
    //同时循环新的节点和老的节点 有一方循环完毕就结束
    if(isSameVnode(oldStartVnode, newStartVnode)){
      patch(oldStartVnode,newStartVnode)
      oldStartVnode = oldChildren[++oldStartIndex]
      newStartVnode = newChildren[++newStartIndex]
    }else if(isSameVnode(oldEndVnode, newEndVnde)){
      patch(oldEndVnode,newEndVnode)
      oldEndVnode = oldChildren[--newEndIndex]
      newEndVnode = newChildren[--newEndVnode]
    }else if(isSameVnode(oldStartVnode,newEndVnode){
      // 头尾比较
      patch(oldStartVnode,newEndVnode)
      el.insertBefore(oldStartVnode.el, oldEndVnode.el.nextSibling)
      oldStartVnode = oldChildren[++oldStartIndex]
      newEndVnode = newChildren[--newEndIndex]
    })else if(isSameVnode(oldEndVnode,newStartVnode)){
      
    }
  }
}


function patchProps(vnode, oldProps = {}){
  let newProps = vnode.data || {}
  let el = vnode.el
  let newStyle = newProps.style || {}
  let oldStyle = oldProps.style || {}
  for (const key in oldStyle){
    if(!newStyle[key]){
      el.style[key] = ''
    }
  }

  for (const key in oldProps) {
    if(!newProps[key]){
      el.removeAttribute(key)
    }
  }

  for(let key in newProps){
    if(key === 'style'){
      for(let styleName in newProps.style){
        el.style[styleName] = newProps.style[styleName]
      }
    }else{
      el.setAttribute(key, newProps[key])
    }
  }
}


export function createElm(vnode){
  let {tag, data, children, text, vm} = vnode
  if(typeof tag === 'string'){
    // if(createComponent(vnode)){
    //   // 返回组件对应的真实节点
    //   return vnde.componentInstance.$el
    // }

    vnode.el = document.createElement(tag)
    patchProps(vnode)
    children.forEach(child => {
      vnode.el.appendChild(createElm(child))
    })

  } else {
    vnode.el = document.createTextNode(text)
  }
  return vnode.el
}

