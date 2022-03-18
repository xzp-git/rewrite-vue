import { compileToFunction } from "./compiler"
import { mergeOptions } from "./utils"
import { callHook, mountComponent } from "./lifecycle"
import {initState} from "./state"

 function initMixin(Vue){
  Vue.prototype._init = function (options) {
    const vm = this
    vm.$options = mergeOptions(vm.constructor.options, options) // 将用户的选项存在实例上

    callHook(vm, 'beforeCreate')
    initState(vm)
    callHook(vm, 'created')



    if (options.el) {
      vm.$mount(options.el)
    }
  }

  Vue.prototype.$mount = function (el) {
    const vm = this
    el = document.querySelector(el)
    let ops = vm.$options
    if (!ops.render) {
      let template
      if (!ops.template && el) {
         template = el.outerHTML
      }else{
        if (ops.template) {
          template = ops.template
        }
      }
      if (template) {
        const render = compileToFunction(template)
        ops.render = render
      }
    }
    mountComponent(vm, el) //组件挂载
  }
}

export default initMixin