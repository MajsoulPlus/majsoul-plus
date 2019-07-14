import { remote } from 'electron'

function changeTheme(mode: string) {
  const extraCss = document.querySelector('#extraCss')
  if (mode === 'dark') {
    extraCss['href'] = './extra/darkMode/style.css'
  }
}

export default function darkMode() {
  if (process.platform === 'darwin') {
    const { systemPreferences } = remote

    const setOSTheme = () => {
      const mode = systemPreferences.isDarkMode() ? 'dark' : 'light'
      changeTheme(mode)
    }

    systemPreferences.subscribeLocalNotification(
      'AppleInterfaceThemeChangeNotification',
      setOSTheme
    )
  }
}
