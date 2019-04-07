// Hack 开启报番型，作者 aoarashi1988，Handle修改
if (game) {
  game.Tools.get_chara_audio = function(e, t) {
    if (t && '' != t) {
      var charid = e.charid,
        chara = cfg.item_definition.character.get(charid)
      if (!chara) return null
      for (
        var a = 6, r = cfg.voice.sound.findGroup(chara.sound), o = [], s = 0;
        s < r.length;
        s++
      )
        r[s].type == t && r[s].level_limit <= a && o.push(s)
      if (0 == o.length) return null
      var h = o[Math.floor(Math.random() * o.length)]
      return {
        path: r[h].path,
        volume: chara.sound_volume,
        time_length: r[h].time_length
      }
    }
  }
  view.AudioMgr.PlayCharactorSound = function(e, t, i) {
    var n = e.charid,
      a = cfg.item_definition.character.get(n)
    if (!a) return null
    for (
      var r = /* e.level */ 6,
        o = cfg.voice.sound.findGroup(a.sound),
        s = [],
        h = 0;
      h < o.length;
      h++
    )
      o[h].type == t && o[h].level_limit <= r && s.push(h)
    if (0 == s.length) return null
    var l = s[Math.floor(Math.random() * s.length)]
    return {
      words: o[l].words,
      sound: this.PlaySound(o[l].path, a.sound_volume, i)
    }
  }

  requestAnimationFrame(function autoRun() {
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