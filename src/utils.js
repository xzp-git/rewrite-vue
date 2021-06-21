export function isFunction(fn){
  return typeof fn === 'function'
}

export function isObject(data){
  return typeof data === 'object' && data !== null
}

export function isReservedTag(tag){
 let str = 'a,div,span,p,img,button,ul,li,h6'
 return str.includes(tag)
}


const callbacks = []
function flushCallbacks(){
  callbacks.forEach(cb => cb())
  waiting = false
}
let waiting = false

function timer(flushCallbacks){
  let timerFn = function() {}

  if(Promise){
    timerFn = () => {
      Promise.resolve().then(flushCallbacks)
    }
  }else if(MutationObserver){
    let textNode = document.createTextNode(1)
    let observe = new MutationObserver(flushCallbacks)
    observe.observe(textNode,{
      characterData:true
    })
    timerFn = () => {
      textNode.textContent = 3
    }
  }else if(setImmediate){
    timerFn = () => {
      setImmediate(flushCallbacks)
    }
  }else{
    timerFn = () =>{
      setTimeout(flushCallbacks,0)
    }
  }
  timerFn()
}

export function nextTick(cb){
  callbacks.push(cb)
  if(!waiting){
    timer(flushCallbacks)
    waiting = true
  }
}
