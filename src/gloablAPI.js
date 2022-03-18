
import Watcher from "./observe/watcher"
import { mergeOptions, nextTick} from "./utils"

 


export function initGlobalAPI(Vue) {
 

  Vue.options = {}

  

  Vue.mixin = function (mixin) {
    this.options = mergeOptions(this.options, mixin)

    return this
  }

  Vue.prototype.$nextTick = nextTick
  Vue.prototype.$watch = function (exprOrFn, cb, options = {}) {
    new Watcher(this, exprOrFn,{user: true, ...options}, cb)
  }

}