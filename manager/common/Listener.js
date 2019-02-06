class Listener {
  constructor () {
    this.handles = []
  }

  on (event, handle) {
    if (typeof event !== 'string') throw new Error('event must be a string !')
    if (typeof handle !== 'function') throw new Error('handle is not a function !')
    for (let index = 0; index < this.handles.length; index++) {
      const element = this.handles[index]
      if (element.event === event && element.handle === handle) {
        return
      }
    }
    this.handles.push({
      event,
      handle })
  }

  off (event, handle) {
    if (typeof event !== 'string') throw new Error('invalid event !')
    if (!handle) {
      this.handles = this.handles.filter(item => item.event !== event)
    } else {
      for (let index = 0; index < this.handles.length; index++) {
        const element = this.handles[index]
        if (element.event === event && element.handle === handle) {
          this.handles.splice(index, 1)
        }
      }
    }
  }

  emit (event, ...args) {
    if (typeof event !== 'string') throw new Error('invalid event !')
    for (let index = 0; index < this.handles.length; index++) {
      const element = this.handles[index]
      if (element.event === event) {
        element.handle.call(...args)
      }
    }
  }
}
module.exports = Listener
