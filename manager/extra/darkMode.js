const { remote: electronRemote } = require('electron')

function changeTheme (mode) {
  const extraCss = document.getElementById('extraCss')
  if (mode === 'dark') {
    extraCss.href = './styles/dark/dark.css'
  } else {
    extraCss.href = './style.css'
  }
}

module.exports = function darkMode () {
  if (process.platform === 'darwin') {
    const { systemPreferences } = electronRemote

    const setOSTheme = function () {
      let mode = systemPreferences.isDarkMode() ? 'dark' : 'light'
      changeTheme(mode)
    }

    systemPreferences.subscribeLocalNotification(
      'AppleInterfaceThemeChangeNotification',
      setOSTheme
    )
  }
}
