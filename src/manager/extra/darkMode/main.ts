import { remote } from 'electron'
import { MajsoulPlus } from '../../../majsoul_plus'

function changeTheme(mode: string) {
  const extraCss = document.querySelector('#extraCss')
  if (mode === 'dark') {
    extraCss['href'] = './extra/darkMode/style.css'
  }
}

export default function darkMode(userConfig: MajsoulPlus.UserConfig) {
  const { nativeTheme } = remote

  const setOSTheme = () => {
    console.log(nativeTheme.shouldUseDarkColors)
    changeTheme(nativeTheme.shouldUseDarkColors ? 'dark' : 'light')
  }

  nativeTheme.addListener('updated', () => {
    setOSTheme()
  })

  setOSTheme()
  // changeTheme(userConfig.window.OSTheme)
}
