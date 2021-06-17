import { parserHTML } from "./parser"



export function compileToFunction(template){
  let root = parserHTML(template)
  console.log(root)
}