import { remote } from 'electron'
import { MajsoulPlus } from '../../../majsoul_plus'

function changeTheme(mode: string) {
  const extraCss = document.querySelector('#extraCss')
  if (mode === 'dark') {
    extraCss['href'] = './extra/darkMode/style.css'
  }
}

export default function darkMode(userConfig: MajsoulPlus.UserConfig) {
  if (process.platform === 'darwin') {
    const { systemPreferences } = remote

    const setOSTheme = () => {
      changeTheme(systemPreferences.isDarkMode() ? 'dark' : 'light')
    }

    systemPreferences.subscribeLocalNotification(
      'AppleInterfaceThemeChangeNotification',
      setOSTheme
    )
  } else {
    changeTheme(userConfig.window.OSTheme)
  }
}
