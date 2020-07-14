const xml2js = require('xml2js')
const fs = require('fs')
const path = require('path')
const chalk = require('chalk')
const terser = require('terser')
// const _ = require('lodash')

const config = require('./config')
const utils = require('./utils')

const parser = new xml2js.Parser(xml2js.defaults["0.2"])
const parserConfig = {
  explicitArray: false
}

// Type indicates the graphic note type, Valid values (from shortest to longest) are 1024th, 512th, 256th, 128th, 64th, 32nd, 16th, eighth, quarter, half, whole, breve, long, and maxima.
const NOTE_TYPES = ['256th', '128th', '64th', '32nd', '16th', 'eighth', 'quarter', 'half', 'whole', 'breve']

const SCORE_NAME = '下一个天亮'

// 自定义解析输出
let parseResult = {}

// start
fs.readFile(utils.getScoreInputPath(SCORE_NAME), (err, xmlstr) => {
  if (err) {
    console.log(err)
    return
  }
  xml2js.parseString(xmlstr, parserConfig, (err, musicjson) => {
    if (err) {
      console.log(err)
      return
    }
    // 输出json
    fs.writeFileSync(utils.getScoreJsonPath(SCORE_NAME), JSON.stringify(musicjson, null, 2))
    console.log(chalk.green('Parse xml to JSON success'))
    // mxl 类型之一，按part并列
    let partwise = utils.getJSONValue(musicjson, 'score-partwise')
    // mxl 类型之一，按time并列
    let timewise = utils.getJSONValue(musicjson, 'score-timewise')

    if (partwise) {
      handlePartwiseScore(musicjson)
    } else if (timewise) {
      handleTimewiseScore(musicjson)
    } else {
      throw new Error('musicxml type error')
    }
  })
})

// Partwise score
function handlePartwiseScore(musicjson) {
  parseResult.musicName = SCORE_NAME
  console.log(chalk.cyan(SCORE_NAME))

  let partlist = utils.getJSONValue(musicjson, 'part-list')
  // scorepart 包含乐谱演奏的基本信息
  let scorepart = utils.getJSONValue(partlist, 'score-part')
  handleScorePart(scorepart)
  // part 乐谱主要部分
  let part = utils.getJSONValue(musicjson, 'part')
  // 节拍器
  let metronome = utils.getJSONValue(part, 'metronome')
  handleMetronome(metronome)
  // 小节，乐谱是由小节构成的
  let measures = utils.getJSONValue(part, 'measure')
  parseResult.measures = []
  // 处理小节
  measures.forEach((measure) => {
    let outputMeasure = {}
    // let notes = [].concat(measure.note) || []
    let notes = measure.note || []
    if (measure.attributes) {
      let divisions = measure.attributes.divisions
      if (Array.isArray(measure.attributes )) {
        divisions = measure.attributes[0].divisions
      }
      if (divisions) {
        // division 四分音符的时长
        parseResult.divisions = +divisions
        console.log(chalk.green('Get Quarter Division Success', parseResult.divisions))
      }
      let key = measure.attributes.key
    }
    if (!notes || !Array.isArray(notes)) {
      // console.error('can not find measure.note', measure);
    }
    if (notes && !Array.isArray(notes)) {
      notes = [].concat(notes)
    }
    if (notes) {
      // 处理音符
      notes.forEach((note) => {
        let outputNote = {
          noteName: '',
          duration: 0,
          voice: ''
        }
        // pitch 音名，包含音调step和音高octave 以及 alter 音调升降
        if (note.pitch) handlePitch(note, outputNote)

        // 休止符
        if (note.hasOwnProperty('rest')) outputNote.rest = true
        // 和弦
        if (note.hasOwnProperty('chord')) outputNote.chord = true
        // 连音
        if (note.hasOwnProperty('tie')) outputNote.tie = note.tie.$ ? note.tie.$.type : ''

        // 音符类型
        if (note.hasOwnProperty('type')) outputNote.type = note.type.toLowerCase()

        // 音符时长
        // outputNote.duration = parseResult.NOTE_DURATION[outputNote.type]
        // 附点音符
        if (note.hasOwnProperty('dot')) {
          outputNote.dot = true
          // outputNote.duration *= 1.5
        }
        if (note.hasOwnProperty('duration')) {
          let duration = note.duration || 0
          outputNote.duration = parseResult.timeUnit * (duration / parseResult.divisions)
        } else {
          outputNote.duration = parseResult.timeUnit * 1
        }

        // 谱号
        outputNote.staff = note.staff || ''
        // 音轨
        outputNote.voice = note.voice || ''

        if (!outputMeasure[`staff${outputNote.staff}`]) {
          outputMeasure[`staff${outputNote.staff}`] = {}
        }
        let targetStaff = outputMeasure[`staff${outputNote.staff}`]
        if (!targetStaff[`voice${outputNote.voice}`]) {
          targetStaff[`voice${outputNote.voice}`] = []
        }
        targetStaff[`voice${outputNote.voice}`].push(outputNote)
      })
    }

    parseResult.measures.push(outputMeasure)
  })
  // 写入文件
  exportResultToFile()
}

// Timewise score
function handleTimewiseScore(musicjson) {
}


function handleScorePart(scorepart) {
  parseResult.partName = scorepart['part-name'] || ''
  parseResult.partAbbr = scorepart['part-abbreviation'] || ''
}

// 节拍器
function handleMetronome(metronome) {
  // "beat-unit": "quarter",
  // "per-minute": "70"
  parseResult.perMinute = metronome['per-minute'] || 1
  parseResult.beatUnit = metronome['beat-unit'] || ''
  parseResult.timeUnit = Math.round( 60 * 1000 / (+parseResult.perMinute) )

  // 计算标准音符时长
  parseResult.NOTE_DURATION = {}
  let beatUnitIndex = NOTE_TYPES.indexOf(parseResult.beatUnit)
  NOTE_TYPES.forEach((TYPE, index) => {
    parseResult.NOTE_DURATION[TYPE] = Math.round( parseResult.timeUnit * Math.pow(2, index - beatUnitIndex) )
  })
  console.log(chalk.cyan('NOTE_DURATION', JSON.stringify(parseResult.NOTE_DURATION) ))
}

// 处理音名
function handlePitch (note, outputNote) {
  // step A-G, octave 1-7
  let step = note.pitch.step
  let octave = note.pitch.octave
  let alter = note.pitch.alter || ''
  outputNote.noteName = step + octave
  if (!alter) return
  // 处理音名升降调
  outputNote.alter = alter
  const StepArr = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
  const len = StepArr.length
  let newStepIndex = StepArr.indexOf(step) + (+alter)
  let newOctave = +octave
  let newStep = step
  if (newStepIndex >= len) {
    newStepIndex = newStepIndex - len
    newOctave++
  } else if (newStepIndex < 0) {
    newStepIndex = len + newStepIndex
    newOctave--
  }
  newStep = StepArr[newStepIndex]
  outputNote.noteName = newStep + newOctave + ''
}

// 输出到文件
function exportResultToFile(minify = true) {
  let content = 'export default ' + JSON.stringify(parseResult, null, 2)
  // 开启压缩
  if (minify) {
    content = terser.minify(content, {
      compress: {
        booleans: false,
        booleans_as_integers: false
      },
      output: {
        keep_quoted_props: true // 保留引号
      }
    })
    if (content.error) {
      console.log(chalk.red(content.error))
    } else {
      content = content.code
    }
  }
  content = content.replace('export default', '').replace(';', '')
  fs.writeFile(utils.getScoreOutputPath(SCORE_NAME), content, () => {})
}