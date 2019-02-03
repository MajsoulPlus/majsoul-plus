class Listener {
  constructor () {
    this.handles = []
  }

  on (event, handle) {
    if ('string' !== typeof event) throw 'event must be a string !'
    if ('function' !== typeof handle) throw 'handle is not a function !'
    for (let index = 0; index < this.handles.length; index++) {
      const element = this.handles[index]
      if (element.event === event && element.handle === handle) {
        return
      }
    }
    this.handles.push({
        event,
        handle
    })
  }

  off (event, handle) {
    if ('string' !== typeof event) throw 'invalid event !'
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

  emit (event) {
    if ('string' !== typeof event) throw 'invalid event !'
    for (let index = 0; index < this.handles.length; index++) {
      const element = this.handles[index]
      if (element.event === event) {
        element.handle.call()
      }
    }
  }
}
module.exports = Listener
