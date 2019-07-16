interface HandlerItem {
  event: string
  handle: Function
}

export default class Listener {
  private handles: HandlerItem[] = []

  on(event: string, handle: Function) {
    for (const element of this.handles) {
      if (element.event === event && element.handle === handle) {
        return
      }
    }
    this.handles.push({
      event,
      handle
    })
  }

  off(event: string, handle?: Function) {
    if (handle) {
      this.handles.forEach((element, index) => {
        if (element.event === event && element.handle === handle) {
          this.handles.splice(index, 1)
        }
      })
    } else {
      this.handles = this.handles.filter(item => item.event !== event)
    }
  }

  emit(event: string, ...args) {
    for (const element of this.handles) {
      if (element.event === event) {
        element.handle(...args)
      }
    }
  }
}
