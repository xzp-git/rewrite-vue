const strats = {}
 const LIFECYCLE = [
   'beforeCreate',
   'created'
 ]
 LIFECYCLE.forEach(hook => {
   strats[hook] = function (p, c) {
     if (c) {
       if (p) {
         return p.concat(c)
       } else {
         return [c]
       }
     } else {
       return p
     }
   }
 })
export function mergeOptions(parent, child) {
   const options = {}
   for (let key in parent) {
     mergeField(key)
   }
   for (let key in child) {
     if (!parent.hasOwnProperty(key)) {
       mergeField(key)
     }
   }

   function mergeField(key) {
     if (strats[key]) {
       options[key] = strats[key](parent[key], child[key])
     } else {
       options[key] = child[key] || parent[key]
     }
   }
   return options
 }



 let callbacks = []
let waiting = false

function flushCallbacks() {
  let cbs = callbacks.slice(0)
  waiting = false
  callbacks = []
  cbs.forEach(cb => cb())
}

let timerFunc

if (Promise) {
  timerFunc = () => {
    Promise.resolve().then(flushCallbacks)
  }
}else if (MutationObserver) {
  let observer = new MutationObserver(flushCallbacks)
  let textNode = document.createTextNode(1)
  observer.observe(textNode,{
    characterData:true
  })
  timerFunc = () => {
    textNode.textContent = 2
  }
}else if (setImmediate) {
  timerFunc = () => {
    setImmediate(flushCallbacks)
  }
}else {
  setTimeout(flushCallbacks)
}

export function nextTick(cb) {
  callbacks.push(cb)
  if (!waiting) {
    timerFunc()
    waiting = true
  }
}