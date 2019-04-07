const { i18n } = require('..//i18nInstance')
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
  throw new Error(i18n.text.manager.XMLHttpRequestFailed(response.status))
}

function _processJson (response) {
  return response.json()
}

module.exports = new NetWork()
