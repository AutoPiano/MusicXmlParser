# MusicXmlParser (Deprecated)
A Simple Parser Converts MusicXml to JSON

自由钢琴早期用到的 MusicXml 解析器，可以将MusicXml文件转换为json结构，同时特异化地提取了xml中相关的元信息，方便进行自动播放。

由于目前自动播放已采用Midi文件解析实现，所以此XML解析器不会重点维护，生产环境使用可能会有风险，仅供参考。


## 运行

~~~
npm install
cd src
node main.js
~~~

结果示例：

~~~
{
  "noteName": "A#3",
  "duration": 1714,
  "voice": "1",
  "alter": "-1",
  "type": "half",
  "staff": "1"
}
~~~