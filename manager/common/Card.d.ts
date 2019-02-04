export = class Card {
  constructor(options: {
    name: ?string,
    author: ?string,
    description: ?string,
    preview: ?string,
    filesDir: string,
  })

  private _getPreviewPath(): string
  private _getRandomId() :string
  private _createDOM():HTMLElement
  private _dom: HTMLElement
  private _editable: boolean
  get DOM(): HTMLElement
  on(event: string, handle: Function): void
  off(event: string, handle: ?Function): void1
  emit(event: string): void
}