const path = require('path')


let getJSONValueResult

/**
 * 从json对象中递归解析某个字段
 * @param {*} json
 * @param {*} keyname
 */
module.exports.getJSONValue = (json, keyname) => {
  if (!json || !keyname || typeof keyname !== 'string') return

  if (json.hasOwnProperty(keyname)) {
    getJSONValueResult = json[keyname]
  } else {
    for (let key in json) {
      let subJson = json[key]
      if (typeof subJson === 'object') {
        getJSONValueResult = this.getJSONValue(subJson, keyname)
      }
    }
  }
  return getJSONValueResult
}

module.exports.getScoreInputPath = (scoreName) => {
  return path.resolve(__dirname + `/../../score_input/${scoreName}.musicxml`)
}
module.exports.getScoreJsonPath = (scoreName) => {
  return path.resolve(__dirname + `/../../score_json/${scoreName}.json`)
}
module.exports.getScoreOutputPath = (scoreName) => {
  return path.resolve(__dirname + `/../../score_output/${scoreName}.json`)
}