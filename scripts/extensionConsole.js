const extensionConsole = id => {
  return new Proxy(
    {},
    {
      get: (target, name) => {
        return typeof console[name] !== 'function'
          ? () => undefined
          : (...args) => {
              if (args.length === 0) return undefined
              else if (typeof args[0] === 'string')
                args[0] = `[${id}] ${args[0]}`
              else args = [`[${id}]`, ...args]
              return console[name].apply(this, args)
            }
      }
    }
  )
}
