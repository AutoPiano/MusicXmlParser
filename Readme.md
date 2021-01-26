MusicXmlParser (obsoleto)
Un analizador simple convierte MusicXml a JSON

自由 钢琴 早期 用到 的 MusicXml 解析器 ， 可以 将 MusicXml 文件 转换 为 json 结构 ， 同时 特异 化 地 提取 了 xml 中 相关 的 元 信息 ， 方便 进行 自动 播放。

由于 目前 自动 播放 已 采用 Midi 文件 解析 实现 ， 所以 此 XML 解析器 不会 重点 维护 ， 生产 环境 使用 可能 会有 风险 ， 仅供 参考。

运行
npm install
cd src
node main.js
结果 示例 ：

{
  "noteName": "A#3",
  "duration": 1714,
  "voice": "1",
  "alter": "-1",
  "type": "half",
  "staff": "1"
}
