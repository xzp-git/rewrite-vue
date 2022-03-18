import { compileToFunction } from "./compiler";
import { initGlobalAPI } from "./gloablAPI";
import initMixin from "./init";
import { initLifeCycle } from "./lifecycle";
import { createElm, patch } from "./vdom/patch";

function Vue(options) {
  this._init(options);
}

initMixin(Vue);
initLifeCycle(Vue);
initGlobalAPI(Vue);

//-------------------------------为了方便观察前后的虚拟节点----------------------------------------------

let render1 = compileToFunction(`<ul>
<li key="d" style="color:red" >d</li>
<li key="a" style="color:red" >a</li>
<li key="b" style="color:red" >b</li>
<li key="c" style="color:red" >c</li>
</ul>`);
let vm1 = new Vue({ data: { name: "www" } });
let prevVnode = render1.call(vm1);
let el = createElm(prevVnode);
document.body.appendChild(el);

let render2 = compileToFunction(`<ul>
<li key="a" style="color:pink" >a</li>
<li key="b" style="color:pink" >b</li>
<li key="c" style="color:pink" >c</li>
<li key="d" style="color:pink" >d</li>
</ul>`);
let vm2 = new Vue({ data: { name: "fff" } });
let nextVnode = render2.call(vm2);

setTimeout(() => {
  patch(prevVnode, nextVnode);
}, 1000);

export default Vue;
