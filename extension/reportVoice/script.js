// Hack 开启报番型，作者 Majsoul Plus Team
if (game) {
  requestAnimationFrame(function autoRun () {
    try {
      const arrBackup = cfg.voice.sound.groups_
      if (!arrBackup || arrBackup.length === 0) {
        throw new Error()
      }
      console.log('Hacked所有语音')
      Object.entries(cfg.voice.sound.groups_).forEach(
        ([soundID, soundGroup]) => {
          soundGroup.forEach((soundObject, index) => {
            soundObject.level_limit = 0
          })
        }
      )
    } catch (error) {
      requestAnimationFrame(autoRun)
    }
  })
}
