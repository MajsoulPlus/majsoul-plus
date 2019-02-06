class Panel {
  constructor(){
    this.activeIndex = 0
    this.panels = []
  }

  _handleClick(index){
    this.activeIndex = index
    this.render()
  }

  init(){
    this.panels = Array.from(document.querySelectorAll('.left-panel ul li'))
    this.panels.forEach((panel, index) => {
      panel.addEventListener('click', () => this._handleClick(index))
    })
    this.render()
  }

  render(){
    if (this.panels.length) {
      const currentPanel = this.panels[this.activeIndex]
      const sections = Array.from(document.getElementsByTagName('section'))
      const activeSection = sections.find(section => section.dataset.name === currentPanel.dataset.target)
      sections.forEach(section => {
        section.className = ''
      })
      activeSection.className = 'show'
      this.panels.forEach(panel => {
        panel.className = ''
      })
      currentPanel.className = 'active'
    }
  }
}

module.exports = new Panel()