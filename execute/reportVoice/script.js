// Hack 开启报番型，作者 aoarashi1988
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
}
