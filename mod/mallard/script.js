// 修改千织语音台词
let raf = requestAnimationFrame(function autoRun() {
  try {
    const arrBackup = cfg.voice.sound.groups_
    if (!arrBackup || arrBackup.length === 0) {
      throw new Error()
    }
    console.log('Hacked语音')
    Object.entries(cfg.voice.sound.groups_).forEach(([soundID, soundGroup]) => {
      if (soundID == 4) {
        const changeMap = {
          大厅交互语音1: {
            words: '嘎！',
            path: 'audio/sound/mallard/quack'
          },
          大厅交互语音2: {
            words: '嘎！',
            path: 'audio/sound/mallard/quack'
          },
          大厅交互语音3: {
            words: '嘎！',
            path: 'audio/sound/mallard/quack'
          },
          大厅交互语音4: {
            words: '嘎！',
            path: 'audio/sound/mallard/quack'
          },
          大厅交互语音5: {
            words: '嘎！',
            path: 'audio/sound/mallard/quack'
          },
          大厅交互语音6: {
            words: '嘎！',
            path: 'audio/sound/mallard/quack'
          },
          大厅交互语音7: {
            words: '嘎！',
            path: 'audio/sound/mallard/quack'
          },
          大厅交互语音8: {
            words: '嘎！',
            path: 'audio/sound/mallard/quack'
          }
        }
        const keyArray = Object.keys(changeMap)
        soundGroup.forEach((soundObject, index) => {
          // soundObject.level_limit = 0
          if (keyArray.includes(soundObject.name)) {
            soundGroup[index] = {
              ...soundObject,
              ...changeMap[soundObject.name]
            }
          }
        })
      }
    })
  } catch (error) {
    raf = requestAnimationFrame(autoRun)
  }
})
