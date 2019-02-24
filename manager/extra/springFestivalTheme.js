function isSpringFestival () {
  const start = new Date('2019-02-03 00:00:00')
  const end = new Date('2019-02-13 00:00:00')
  const now = Date.now()
  return now < end && now > start
}

module.exports = function springFestivalExtend () {
  const extraCss = document.getElementById('extraCss')
  setTimeout(() => {
    if (isSpringFestival()) {
      extraCss.href = './styles/springfestival/springfestival.css'
    }
  }, 0)
}
