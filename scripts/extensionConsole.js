const extensionConsole = id => {
  return new Proxy(
    {},
    {
      get: (target, name) => {
        return typeof console[name] === 'function'
          ? (...args) => console[name].apply(this, [`[${id}]`, ...args])
          : () => undefined
      }
    }
  )
}
