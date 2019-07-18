const extensionFetch = id => {
  return (input, init) => {
    if (typeof input !== 'string') {
      return
    }
    return fetch(`majsoul_plus/extension/${id}/${input}`, init)
  }
}
