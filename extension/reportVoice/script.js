// Hack 开启报番型，作者 Majsoul Plus Team

const hackVoice = () => {
  if (cfg && cfg.voice && cfg.voice.sound) {
    cfg.voice.sound.rows_.forEach(sound => {
      sound.level_limit = 0
      sound.bond_limit = 0
    })
  }
}

const autoRun = () => {
  try {
    if (cfg.voice.sound) {
      const raw = cfg.voice.sound
      let timer = 0
      const proxy = new Proxy(raw, {
        get(target, key) {
          clearTimeout(timer)
          timer = setTimeout(hackVoice, 0)
          return target[key]
        },
        set(target, key, value) {
          target[key] = value
          clearTimeout(timer)
          timer = setTimeout(hackVoice, 0)
          return true
        }
      })
      cfg.voice.sound = proxy
      console.log('Hacked所有语音')
    } else {
      throw new Error()
    }
  } catch (error) {
    requestAnimationFrame(autoRun)
  }
}

const reportVoice = setInterval(() => {
  if (game) {
    clearInterval(reportVoice)
    requestAnimationFrame(autoRun)
  }
}, 1000)
