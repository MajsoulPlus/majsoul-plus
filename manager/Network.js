class NetWork {
  getJson (input, params) {
    return new Promise((resolve, reject) => {
      (function timeout () {
        setTimeout(() => {
          reject(new Error('network request timeout'))
        }, 30 * 1000)
      })()
      fetch(input, params)
        .then(_checkStatus)
        .then(_processJson)
        .then(resolve)
        .catch(reject)
    })
  }
}

function _checkStatus (response) {
  if (response.ok && response.status >= 200 && response.status < 400) {
    return response
  }
  throw new Error('network request failed')
}

function _processJson (response) {
  return response.json()
}

module.exports = new NetWork()
