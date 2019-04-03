import { App, app, remote } from "electron";
import { I18n } from "./i18n";

let myApp: App;
if (app) {
  myApp = app;
} else {
  myApp = remote.app;
}

export const i18nInstance = new I18n({
  autoReload: process.env.NODE_ENV === "development",
  actives: [app.getLocale()]
});
