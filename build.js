const { ncp } = require("ncp");
const { readFile, writeFile } = require("fs");
const dest = "./dist/";

// Copy files
ncp("./bin", dest + "bin", err => (err ? console.error(err) : null));
ncp("./certificate", dest + "certificate", err =>
  err ? console.error(err) : null
);
ncp("./execute", dest + "execute", err => (err ? console.error(err) : null));
ncp("./i18n", dest + "i18n", err => (err ? console.error(err) : null));
ncp("./manager", dest + "manager", err => (err ? console.error(err) : null));
ncp("./mod", dest + "mod", err => (err ? console.error(err) : null));
ncp("./tool", dest + "tool", err => (err ? console.error(err) : null));

ncp("./configs-user.json", dest + "configs-user.json", err =>
  err ? console.error(err) : null
);

// mainLoader.ts
// 移除包含 exports 的第二行
readFile(dest + "bin/main/mainLoader.js", { encoding: "utf-8" }, function(
  err,
  data
) {
  if (err) {
    console.error(err);
    return;
  }
  const lines = data.split("\n");
  lines.splice(1, 1);
  writeFile(
    dest + "bin/main/mainLoader.js",
    lines.join("\n"),
    { encoding: "utf-8" },
    () => {}
  );
});
