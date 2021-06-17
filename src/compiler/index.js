import { parserHTML } from "./parser"
import { generate } from "./generate"


export function compileToFunction(template){
  let root = parserHTML(template)

  let code = generate(root)

  console.log(code)
  
}