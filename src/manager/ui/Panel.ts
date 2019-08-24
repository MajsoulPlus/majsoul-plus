class Panel {
  private activeIndex = 0
  private panels: HTMLElement[] = []

  private handleClick(index: number) {
    this.activeIndex = index
    this.render()
  }

  private render() {
    if (this.panels.length > 0) {
      const currentPanel = this.panels[this.activeIndex]
      const sections = Array.from(document.getElementsByTagName('section'))
      const activeSection = sections.find(
        section => section.dataset.name === currentPanel.dataset.target
      )
      sections.forEach(section => (section.className = ''))
      activeSection.className = 'show'
      this.panels.forEach(panel => (panel.className = ''))
      currentPanel.className = 'active'
    }
  }

  init() {
    this.panels = Array.from(document.querySelectorAll('#left-panel ul li'))
    this.panels.forEach((panel, index) => {
      panel.addEventListener('click', () => this.handleClick(index))
    })
    this.render()
  }
}

export default new Panel()
