/**
 * 以 latest 对象中的内容更新 toUpdate 对象
 * 若不存在则创建
 * @param toUpdate
 * @param latest
 */
export function updateObject(toUpdate: {}, latest: {}): {} {
  for (const key in toUpdate) {
    if (typeof toUpdate[key] === 'object' && typeof latest[key] === 'object') {
      updateObject(toUpdate[key], latest[key]);
    } else if (latest[key] === undefined) {
      delete toUpdate[key];
    }
  }
  for (const key in latest) {
    if (toUpdate[key] === undefined) {
      toUpdate[key] = latest[key];
    }
  }
  return toUpdate;
}

/**
 * 以 latest 对象的内容填充 toFill 对象中不存在的部分
 * @param toFill
 * @param latest
 */
export function fillObject(toFill: {}, latest: {}): {} {
  for (const key in latest) {
    if (typeof toFill[key] === 'object' && typeof latest[key] === 'object') {
      updateObject(toFill[key], latest[key]);
    } else if (toFill[key] === undefined) {
      toFill[key] = {};
      updateObject(toFill[key], latest[key]);
    }
  }
  return toFill;
}

/**
 * 清理 toClean 对象中存在 但 sample 对象中不存在的键值
 * @param toClean
 * @param sample
 */
export function cleanObject(toClean: {}, sample: {}): {} {
  for (const key in toClean) {
    if (sample[key] === undefined) {
      delete toClean[key];
    }
  }
  return toClean;
}
