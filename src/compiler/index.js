import { parserHTML } from "./parser"
import { generate } from "./generate"


export function compileToFunction(template){
  let root = parserHTML(template)

  let code = generate(root)

  let render = new Function(`with(this){return ${code} }`)
  return render

}