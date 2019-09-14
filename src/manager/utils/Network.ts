import i18n from '../../i18n'

export default class Network {
  static getJson(input: RequestInfo, init?: RequestInit) {
    return new Promise((resolve, reject) => {
      ;(function timeout() {
        setTimeout(() => {
          reject(new Error('network request timeout'))
        }, 30 * 1000)
      })()
      fetch(input, init)
        .then(_checkStatus)
        .then(_processJson)
        .then(resolve)
        .catch(reject)
    })
  }
}

function _checkStatus(response: Response) {
  if (response.ok && response.status >= 200 && response.status < 400) {
    return response
  }
  throw new Error(
    i18n.text.manager.XMLHttpRequestFailed(String(response.status))
  )
}

function _processJson(response: Response) {
  return response.json()
}
