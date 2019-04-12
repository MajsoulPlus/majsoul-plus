const { ncp } = require("ncp");
const dest = "./dist/";

// Copy files
ncp("./assets", dest, err => (err ? console.error(err) : null));
ncp("./manager", dest + "manager", err => (err ? console.error(err) : null));
ncp("./i18n", dest + "i18n", err => (err ? console.error(err) : null));
ncp("./execute", dest + "execute", err => (err ? console.error(err) : null));
ncp("./mod", dest + "mod", err => (err ? console.error(err) : null));
ncp("./extension", dest + "extension", err => (err ? console.error(err) : null));
ncp("./tool", dest + "tool", err => (err ? console.error(err) : null));

ncp("./configs-user.json", dest + "configs-user.json", err =>
  err ? console.error(err) : null
);
