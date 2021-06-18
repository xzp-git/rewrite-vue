import { nextTick } from '../utils'

let queue = []
let has = {}
let pending = false

function flushSchedulerQueue(params){
  for(let i = 0; i < queue.length; i++){
    queue[i].run()
  }
  queue = []
  has = {}
  pending = false
}


export function queueWatcher(watcher){
  const id = watcher.id

  if(has[id] == null){
    queue.push(watcher)
    has[id] = true
    if(!pending){
      nextTick(flushSchedulerQueue)
      pending = true
    }
  }
}