class Utility {
  protected name: string

  protected execute() {}

  register() {
    try {
      this.execute()
    } catch (e) {
      console.error(`Failed to register utility: ${this.name}`)
    }
  }
}

export default Utility
