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
        this.panels = Array.from(document.querySelectorAll('.left-pannel ul li'))
        panels.forEach((panel, index) => {
            panel.addEventListener('click', () => this._handleClick(index))
        })
        this.render()
    }

    render(){
        if (this.panels.length) {
            const currentPanel = this.panels[this.activeIndex]
            const activeSection = sections.find(section => section.dataset.name === currentPanel.dataset.target)
            const sections = Array.from(document.getElementsByTagName('section'))
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