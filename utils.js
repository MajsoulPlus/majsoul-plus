// 这段代码来自
// https://github.com/aoarashi1988/majsoul_custrom_charactor/blob/master/script/util.js
// 作者 aoarashi1988

const utils = {
  /**
   * 对图像进行 XOR 运算加密或解密
   * @param {Buffer} buffer
   * @returns {Buffer}
   */
  xorImage: function(buffer) {
    let array = []
    for (let index = 0; index < buffer.length; index++) {
      const byte = buffer.readUInt8(index)
      array.push(73 ^ byte)
    }
    return Buffer.from(array)
  }
}
module.exports = utils
