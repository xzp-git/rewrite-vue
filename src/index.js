import initMixin from "./init"
import { initLifeCycle } from "./lifecycle"


function Vue(options) {
  this._init(options)
}


initMixin(Vue)
initLifeCycle(Vue)
export default Vue