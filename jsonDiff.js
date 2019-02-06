export function jsonKeyDiff (ja, jb, diffs, root) {
  ja.keys().foreach(key => {
    if (typeof ja[key] === 'object' && typeof jb[key] === 'object') {
      jsonKeyDiff(ja[key], jb[key], diffs, root.push(key))
    }
    if (jb[key] === undefined) {
      diffs.add({ path: root.toString(), key: key, type: 'delete' })
    }
  })
  jb.keys().foreach(key => {
    if (ja[key] === undefined) {
      diffs.add({ path: root.toString(), key: key, type: 'add' })
    }
  })
}
