// Hack 开启报番型，作者 aoarashi1988
!function (e) {
  var t = function () {
    function t() { }
    return Object.defineProperty(t, "currentTime", {
      get: function () {
        return Math.floor(Date.now() / 1e3)
      },
      enumerable: !0,
      configurable: !0
    }),
      t.time2YearMounthDate = function (e) {
        var t = new Date(1e3 * e)
          , i = "";
        return i += t.getFullYear() + "/",
          i += (t.getMonth() < 9 ? "0" : "") + (t.getMonth() + 1).toString() + "/",
          i += (t.getDate() < 10 ? "0" : "") + t.getDate()
      }
      ,
      t.time2HourMinute = function (e, t) {
        void 0 === t && (t = !1);
        var i = new Date(1e3 * e)
          , n = "";
        return n += (i.getHours() < 10 ? "0" : "") + i.getHours() + ":",
          n += (i.getMinutes() < 10 ? "0" : "") + i.getMinutes(),
          t && (n += ":",
            n += (i.getSeconds() < 10 ? "0" : "") + i.getSeconds()),
          n
      }
      ,
      t.time2Desc = function (e) {
        var t = Math.floor(Date.now() / 1e3) - e;
        if (t < 600)
          return "刚刚";
        if (t < 3600) {
          return (i = Math.floor(t / 10 / 60)).toString() + "0分钟前"
        }
        if (t < 86400) {
          return (i = Math.floor(t / 60 / 60)).toString() + "小时前"
        }
        if (t < 604800) {
          return (i = Math.floor(t / 24 / 60 / 60)).toString() + "天前"
        }
        if (t < 18144e3) {
          var i = Math.floor(t / 7 / 24 / 60 / 60);
          return i.toString() + "星期前"
        }
        return "1个月前"
      }
      ,
      t.timelength2Desc = function (e) {
        var t = ""
          , i = e;
        return i % 60 > 0 && (t = i % 60 + "秒"),
          (i = Math.floor(i / 60)) % 60 > 0 && (t = i % 60 + "分" + t),
          (i = Math.floor(i / 60)) % 24 > 0 && (t = i % 24 + "小时" + t),
          (i = Math.floor(i / 24)) > 0 && (t = i + "天" + t),
          "" == t && (t = "0秒"),
          t
      }
      ,
      t.playState2Desc = function (e) {
        if (!e)
          return "";
        if (!e.game_uuid || "" == e.game_uuid)
          return "";
        if (1 == e.category)
          return "友人场";
        if (2 == e.category && e.meta) {
          var t = cfg.desktop.matchmode.get(e.meta.mode_id);
          if (t)
            return t.room_name
        }
        return ""
      }
      ,
      t.setGrayDisable = function (e, t) {
        t ? (e.mouseEnabled = !1,
          e.filters = [new Laya.ColorFilter(uiscript.GRAY_FILTER)]) : (e.mouseEnabled = !0,
            e.filters = [])
      }
      ,
      t.generateUUID = function () {
        var e = (new Date).getTime();
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (t) {
          var i = (e + 16 * Math.random()) % 16 | 0;
          return e = Math.floor(e / 16),
            ("x" == t ? i : 3 & i | 8).toString(16)
        })
      }
      ,
      Object.defineProperty(t, "deviceInfo", {
        get: function () {
          var t = {};
          t["client-version"] = e.ResourceVersion.version;
          var i = [];
          if (Laya.Browser.onIOS && i.push("onIOS"),
            Laya.Browser.onMac && i.push("onMac"),
            Laya.Browser.onIPad && i.push("onIPad"),
            (Laya.Browser.onAndriod || Laya.Browser.onAndroid) && i.push("onAndroid"),
            Laya.Browser.onSafari && i.push("onSafari"),
            Laya.Browser.onFirefox && i.push("onFirefox"),
            Laya.Browser.onEdge && i.push("onEdge"),
            Laya.Browser.onWeiXin && i.push("onWeiXin"),
            Laya.Browser.onMiniGame && i.push("onMiniGame"),
            Laya.Browser.onMQQBrowser && i.push("onMQQBrowser"),
            Laya.Render.isConchApp ? i.push("onApp") : Laya.Browser.onPC && i.push("onPC"),
            i.length > 0) {
            for (var n = "", a = 0; a < i.length; a++)
              0 != a && (n += "|"),
                n += i[a];
            t.device = n
          } else
            t.device = "unknown";
          return t
        },
        enumerable: !0,
        configurable: !0
      }),
      t.strWithoutForbidden = function (e) {
        var t = e;
        return cfg.info.forbidden.forEach(function (e, i) {
          if ("" != e.word)
            for (; ;) {
              if (!(t.indexOf(e.word) >= 0))
                break;
              for (var n = "", a = 0; a < e.word.length; a++)
                n += "*";
              t = t.replace(e.word, n)
            }
        }),
          t
      }
      ,
      t.faceOn = function (t, i, n, a, r) {
        a.visible = !1;
        var o = cfg.item_definition.skin.get(t);
        if (o) {
          a.skin = e.LoadMgr.getResImageSkin(o.path + "/" + i + ".png");
          var s = r.width / o[n + "_width"]
            , h = r.height / o[n + "_height"];
          a.anchorX = 0,
            a.anchorY = 0,
            a.width = o.face_width * s,
            a.height = o.face_height * h,
            a.x = (o.face_x - o[n + "_x"]) * s,
            a.y = (o.face_y - o[n + "_y"]) * h,
            a.visible = !0
        }
      }
      ,
      t.charaPart = function (t, i, n, a) {
        var r = cfg.item_definition.skin.get(400101);
        if (r) {
          var o = cfg.item_definition.skin.get(t);
          o && (i.skin = e.LoadMgr.getResImageSkin(o.path + "/" + n + ".png"),
            i.width = a.width * o[n + "_width"] / r[n + "_width"],
            i.height = a.height * o[n + "_height"] / r[n + "_height"],
            i.x = a.x + (o[n + "_x"] - r[n + "_x"]) * a.width / r[n + "_width"] * i.scaleX,
            i.y = a.y + (o[n + "_y"] - r[n + "_y"]) * a.height / r[n + "_height"] * i.scaleY)
        }
      }
      ,
      t.showRewards = function (e, t) {
        for (var i = this, n = [], a = [], r = 0; r < e.rewards.length; r++)
          100099 != e.rewards[r].id && (100098 != e.rewards[r].id ? 6 == Math.floor(e.rewards[r].id / 1e5) ? a.push(e.rewards[r].id) : n.push(e.rewards[r]) : uiscript.UI_LightTips.Inst.show("使用成功"));
        var o = !1
          , s = 0
          , h = function () {
            if (!o && n.length > 0)
              return uiscript.UI_Getrewardextends.Inst.show(n, Laya.Handler.create(i, function () {
                h()
              })),
                void (o = !0);
            s < a.length ? uiscript.UI_Gettitle.Inst.show(a[s++], Laya.Handler.create(i, function () {
              h()
            })) : t && t.run()
          };
        h()
      }
      ,
      t.debugFetchMultiAccountBrief = function (e, t, i, n) {
        if (!(Laya.timer.currTimer < this.debugfetchcd)) {
          this.debugfetchcd = Laya.timer.currTimer + 3e5;
          var a = {};
          a.type = "debugFetchMultiAccountBrief",
            a.pos = e,
            a.index = t,
            a.total = i,
            a.value_count = n;
          (new Laya.HttpRequest).send(GameMgr.error_url, "data=" + JSON.stringify(a), "post")
        }
      }
      ,
      t.get_room_desc = function (e) {
        if (!e)
          return {
            text: "",
            isSimhei: !1
          };
        var t = "";
        if (e.meta && e.meta.tournament_id) {
          var i = cfg.tournament.tournaments.get(e.meta.tournament_id);
          return i && (t = i.name),
            {
              text: t,
              isSimhei: !0
            }
        }
        if (1 == e.category)
          t += "友人场·";
        else if (4 == e.category)
          t += "比赛场·";
        else if (2 == e.category) {
          var n = e.meta;
          if (n) {
            var a = cfg.desktop.matchmode.get(n.mode_id);
            a && (t += a.room_name + "·")
          }
        }
        switch (e.mode.mode) {
          case 0:
            t += "一局胜负";
            break;
          case 1:
            t += "四人东";
            break;
          case 2:
            t += "四人南";
            break;
          case 3:
            t = "人机模式"
        }
        return {
          text: t,
          isSimhei: !1
        }
      }
      ,
      t.get_chara_audio = function (e, t) {
        if (t && "" != t) {
          var charid = e.charid
            , chara = cfg.item_definition.character.get(charid);
          if (!chara)
            return null;
          for (var a = 6, r = cfg.voice.sound.findGroup(chara.sound), o = [], s = 0; s < r.length; s++)
            r[s].type == t && r[s].level_limit <= a && o.push(s);
          if (0 == o.length)
            return null;
          var h = o[Math.floor(Math.random() * o.length)];
          return {
            path: r[h].path,
            volume: chara.sound_volume,
            time_length: r[h].time_length
          }
        }
      }
      ,
      t.encode_account_id = function (e) {
        return 1358437 + (7 * e + 1117113 ^ 86216345)
      }
      ,
      t.decode_account_id = function (e) {
        return ((e - 1358437 ^ 86216345) - 1117113) / 7
      }
      ,
      t.child_align_center = function (e, t) {
        for (var i = [], n = 0; n < e.numChildren; n++) {
          if ((s = e.getChildAt(n)).visible) {
            var a = s.width;
            s instanceof Laya.Text ? a = s.textWidth : s instanceof Laya.Label && (a = s.textField.textWidth),
              i.push(a * s.scaleX)
          }
        }
        for (var r = 0, n = 0; n < i.length; n++)
          r += i[n],
            t && n < t.length && (r += t[n]);
        for (var o = e.width / 2 - r / 2, n = 0; n < e.numChildren; n++) {
          var s = e.getChildAt(n);
          s.visible && (s.x = o + s.pivotX * s.scaleX,
            o += i[n],
            t && n < t.length && (o += t[n]))
        }
      }
      ,
      t.build_char_map = function () {
        if (!this.char_map) {
          for (var e = [], t = "a".charCodeAt(0), i = 0; i < 26; i++)
            e.push(String.fromCharCode(t + i));
          for (var n = "A".charCodeAt(0), i = 0; i < 26; i++)
            e.push(String.fromCharCode(n + i));
          for (i = 0; i < 10; i++)
            e.push(i.toString());
          e.push("-"),
            this.char_lst = e,
            this.char_map = {};
          for (i = 0; i < e.length; i++)
            this.char_map[e[i]] = i
        }
      }
      ,
      t.encode_str = function (e) {
        this.build_char_map();
        for (var t = "", i = 0; i < e.length; i++) {
          var n = 2 + 3 * i ^ 11
            , a = e[i];
          null != this.char_map[a] ? t += this.char_lst[(this.char_map[a] + n) % this.char_lst.length] : t += a
        }
        return t
      }
      ,
      t.decode_str = function (e) {
        this.build_char_map();
        for (var t = "", i = 0; i < e.length; i++) {
          var n = 2 + 3 * i ^ 11
            , a = e[i];
          null != this.char_map[a] ? t += this.char_lst[(this.char_map[a] - n + this.char_lst.length) % this.char_lst.length] : t += a
        }
        return t
      }
      ,
      t.open_new_window = function (e) {
        var t = document.createElement("a");
        t.href = e,
          t.target = "_blank",
          t.click(),
          t.remove()
      }
      ,
      t.base64ToBlob = function (e, t) {
        for (var i = e.split(","), n = i[0].match(/:(.*?);/)[1] || t, a = window.atob(i[1]), r = new ArrayBuffer(a.length), o = new Uint8Array(r), s = 0; s < a.length; s++)
          o[s] = a.charCodeAt(s);
        return new Blob([r], {
          type: n
        })
      }
      ,
      t.stringContainerSub = function (e, t) {
        if (!t || "" == t)
          return !0;
        if (!e || "" == e)
          return !1;
        for (var i = 0, n = 0; n < e.length; n++)
          if (e.charAt(n) == t.charAt(i) && ++i >= t.length)
            return !0;
        return !1
      }
      ,
      t.debugfetchcd = 0,
      t.char_lst = null,
      t.char_map = null,
      t
  }();
  e.Tools = t
  console.log("hacked")
}(game || (game = {}));