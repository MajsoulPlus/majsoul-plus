import { ipcRenderer } from 'electron'
import { MajsoulPlus } from '../../../majsoul_plus'

function changeTheme(mode: string) {
  const extraCss = document.querySelector('#extraCss')
  if (mode === 'dark') {
    extraCss['href'] = './extra/darkMode/style.css'
  }
}

export default function darkMode(userConfig: MajsoulPlus.UserConfig) {
  const setOSTheme = async () => {
    try {
      // Use IPC to get dark mode status from main process
      const isDarkMode = await ipcRenderer.invoke('get-dark-mode-status')
      changeTheme(isDarkMode ? 'dark' : 'light')
    } catch (error) {
      console.error('Failed to get dark mode status:', error)
    }
  }

  // Set initial theme
  setOSTheme()

  // Listen for theme changes
  ipcRenderer.on('dark-mode-updated', (event, isDarkMode) => {
    changeTheme(isDarkMode ? 'dark' : 'light')
  })
}
