

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

