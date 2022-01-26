import {initState} from "./state"

 function initMixin(Vue){
  Vue.prototype._init = function (options) {
    const vm = this
    vm.$options = options // 将用户的选项存在实例上
    initState(vm)
  }
}

export default initMixin