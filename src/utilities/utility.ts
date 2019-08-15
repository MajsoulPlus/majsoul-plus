import { Logger } from '../global'

class Utility {
  protected name: string

  protected execute() {}

  register() {
    try {
      this.execute()
    } catch (e) {
      Logger.error(`Failed to register utility: ${this.name}`)
      Logger.error(e)
    }
  }
}

export default Utility
