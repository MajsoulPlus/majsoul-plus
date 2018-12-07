function FindProxyForURL(url, host) {
  if (host == 'majsoul.union-game.com') {
    return 'PROXY 127.0.0.1:8888'
  }
  return 'DIRECT'
}
