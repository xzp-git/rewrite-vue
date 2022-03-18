import { isSameVnode } from ".";

export function createElm(vnode) {
  let { tag, data, children, text } = vnode;
  if (typeof tag === "string") {
    vnode.el = document.createElement(tag);

    patchProps(vnode.el, {}, data);

    children.forEach((child) => {
      vnode.el.appendChild(createElm(child));
    });
  } else {
    vnode.el = document.createTextNode(text);
  }
  return vnode.el;
}
export function patchProps(el, oldProps = {}, props = {}) {
  //老的属性中有 新的没有 要删除老的

  let oldStyle = oldProps.style || {};
  let newStyle = props.style || {};

  for (let key in oldStyle) {
    if (!newStyle[key]) {
      el.style[key] = "";
    }
  }

  for (let key in oldProps) {
    if (!props[key]) {
      el.removeAttribute(key);
    }
  }

  for (let key in props) {
    if (key === "style") {
      for (let styleName in props.style) {
        el.style[styleName] = props.style[styleName];
      }
    } else {
      el.setAttribute(key, props[key]);
    }
  }
}

export function patch(oldVnode, vnode) {
  //写的是初渲染流程
  const isRealElement = oldVnode.nodeType;
  if (isRealElement) {
    const elm = oldVnode;
    const parentElm = elm.parentNode; //拿到父元素
    let newElm = createElm(vnode);
    parentElm.insertBefore(newElm, elm.nextSibiling);
    parentElm.removeChild(elm);
    return newElm;
  } else {
    //1 两个节点不是同一个节点 直接删除老的换上新的
    //2 两个节点是同一个节点 （判断节点 的tag 和 节点的key）比较 两个节点的属性是否有差异
    //3 节点比较完毕后就需要比较两个人的儿子

    return patchVnode(oldVnode, vnode);
  }
}

function patchVnode(oldVnode, vnode) {
  if (!isSameVnode(oldVnode, vnode)) {
    let el = createElm(vnode);
    oldVnode.el.parentNode.replaceChild(el, oldVnode.el);
    return el;
  }
  //文本的情况 文本我们期望比较一下文本的内容
  let el = (vnode.el = oldVnode.el);
  if (!oldVnode.tag) {
    //不存在tag 则是文本
    if (oldVnode.text !== vnode.text) {
      el.textContent = vnode.text;
    }
  }

  /**
   * 如果是标签 我们需要更新属性
   */
  patchProps(el, oldVnode.data, vnode.data);

  /**
   * 比较完自身节点后，比较儿子的节点
   * 比较的时候 一方有儿子 一方没有儿子
   *           两方都有儿子
   */

  let oldChildren = oldVnode.children || [];
  let newChildren = vnode.children || [];

  if (oldChildren.length > 0 && newChildren.length > 0) {
    //完整的diff算法 需要比较两个人的儿子
    updateChildren(el, oldChildren, newChildren);
  } else if (newChildren.length > 0) {
    //老的没有 新的有
    mountChildren(el, newChildren);
  } else if (oldChildren.length > 0) {
    //新的没有 老的有
    unMountChildren(el, oldChildren);
  }

  return el;
}

function updateChildren(el, oldChildren, newChildren) {
  /**
   * 为了比较两个儿子的时候，提高性能，我们会有一些优化手段
   * 我们操作列表 经常会有 push shift pop unshift reverse sort 这些方法 针对这些情况做一些优化
   * vue2中采用双指针的方式 来比较两个节点
   */

  let oldStartIndex = 0;
  let newStartIndex = 0;
  let oldEndIndex = oldChildren.length - 1;
  let newEndIndex = newChildren.length - 1;

  let oldStartVnode = oldChildren[0];
  let newStartVnode = newChildren[0];

  let oldEndVnode = oldChildren[oldEndIndex];
  let newEndVnode = newChildren[newEndIndex];

  //双方有一方头指针大于尾指针则停止循环
  while (oldStartIndex <= oldEndIndex && newStartIndex <= newEndIndex) {
    if (isSameVnode(oldStartVnode, newStartVnode)) {
      patchVnode(oldStartVnode, newStartVnode); //如果是相同的节点  则递归比较子节点
      oldStartVnode = oldChildren[++oldStartIndex];
      newStartVnode = newChildren[++newStartIndex];
    } else if (isSameVnode(oldEndVnode, newEndVnode)) {
      patchVnode(oldEndVnode, newEndVnode);
      oldEndVnode = oldChildren[--oldEndIndex];
      newEndVnode = newChildren[--newEndIndex];
    } else if (isSameVnode(oldStartVnode, newEndVnode)) {
      patchVnode(oldStartVnode, newEndVnode);
      el.insertBefore(oldStartVnode.el, oldEndVnode.el.nextSibiling);
      oldStartVnode = oldChildren[++oldStartIndex];
      newEndVnode = newChildren[--newEndIndex];
    } else if (isSameVnode(oldEndVnode, newStartVnode)) {
      patchVnode(oldEndVnode, newStartVnode);
      el.insertBefore(oldEndVnode.el, oldStartVnode.el);
      oldEndVnode = oldChildren[--oldEndIndex];
      newStartVnode = newChildren[++newStartIndex];
    }
  }

  if (newStartIndex <= newEndIndex) {
    //多余的就创建插入进去即可
    for (let i = newStartIndex; i <= newEndIndex; i++) {
      let childEl = createElm(newChildren[i]);

      //这里可能是向后追加 也有可能是向前追加

      //参照物
      let anchor = newChildren[newEndIndex + 1]
        ? newChildren[newEndIndex + 1].el
        : null;
      el.insertBefore(childEl, anchor); //anchor 为null则为向后追加
    }
  }

  if (oldStartIndex <= oldEndIndex) {
    for (let i = oldStartIndex; i <= oldEndIndex; i++) {
      let childEl = oldChildren[i].el;
      el.removeChild(childEl);
    }
  }
}

function mountChildren(el, newChildren) {
  for (let i = 0; i < newChildren.length; i++) {
    let child = newChildren[i];
    el.appendChild(createElm(child));
  }
}
function unMountChildren(el, oldChildren) {
  for (let i = 0; i < oldChildren.length; i++) {
    let child = oldChildren[i].el;
    el.removeChild(child);
  }
}
