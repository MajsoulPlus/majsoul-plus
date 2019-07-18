function isThatDay() {
  // only applies between 2019.07.18 00:00:00 and 2019.07.21 00:00:00 (GMT+9)
  return Date.now() >= 1563375600000 && Date.now() <= 1563721200000
}

export default function prayForKyoani() {
  const extraCss = document.querySelector('#extraCss')
  setTimeout(() => {
    if (isThatDay()) {
      extraCss['href'] = './extra/prayForKyoani/style.css'
    }
  }, 0)
}
