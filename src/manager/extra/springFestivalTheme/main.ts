function isSpringFestival() {
  const start = new Date('2019-02-03 00:00:00')
  const end = new Date('2019-02-13 00:00:00')
  const now = new Date()
  return now < end && now > start
}

export default function springFestivalExtend() {
  const extraCss = document.querySelector('#extraCss')
  setTimeout(() => {
    if (isSpringFestival()) {
      extraCss['href'] = './extra/springFestivalTheme/style.css'
    }
  }, 0)
}
