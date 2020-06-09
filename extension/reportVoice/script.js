// Hack 开启报番型，作者 Majsoul Plus Team

function autoRun() {
  try {
    const arrBackup = cfg.voice.sound.rows_
    if (!arrBackup || arrBackup.length === 0) {
      throw new Error()
    }
    cfg.voice.sound.rows_.forEach(sound=>{
      sound.level_limit = 0
      sound.bond_limit = 0
    })
    console.log('Hacked所有语音')
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
