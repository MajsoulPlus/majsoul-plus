// 修改千织语音台词
console.log('已Hack语音')
const funcBackup = cfg.voice.sound.getGroup
cfg.voice.sound.getGroup = function(soundID) {
  const soundGroup = funcBackup.call(this, soundID)
  if (soundID === 4) {
    const changeMap = {
      大厅交互语音1: {
        words: '呱！',
        path: 'audio/sound/mallard/quack'
      },
      大厅交互语音2: {
        words: '呱！',
        path: 'audio/sound/mallard/quack'
      },
      大厅交互语音3: {
        words: '呱！',
        path: 'audio/sound/mallard/quack'
      },
      大厅交互语音4: {
        words: '呱！',
        path: 'audio/sound/mallard/quack'
      },
      大厅交互语音5: {
        words: '呱！',
        path: 'audio/sound/mallard/quack'
      },
      大厅交互语音6: {
        words: '呱！',
        path: 'audio/sound/mallard/quack'
      },
      大厅交互语音7: {
        words: '呱！',
        path: 'audio/sound/mallard/quack'
      },
      大厅交互语音8: {
        words: '呱！',
        path: 'audio/sound/mallard/quack'
      }
    }
    const keyArray = Object.keys(changeMap)
    Object.entries(soundGroup).forEach(([soundKey, soundObject]) => {
      // soundObject.level_limit = 0
      if (keyArray.includes(soundObject.name)) {
        soundGroup[soundKey] = {
          ...soundObject,
          ...changeMap.soundObject.name
        }
      }
    })
  }
  return soundGroup
}
