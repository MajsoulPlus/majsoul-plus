declare namespace MajsoulPlus {
  export interface Mod {
    name: string;
    author: string;
    description: string;
    dir?: string;
    filesDir?: string;
    preview: string;
    replace: Replace[];
    execute: Extension;
  }

  export interface Replace {
    from: string;
    to: string;
  }

  export interface Extension {
    //TODO:
  }
}
