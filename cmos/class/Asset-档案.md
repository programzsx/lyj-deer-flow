# Asset档案

源码位置：backend/packages/harness/deerflow/extensions/browser_assets.py

## 一、这个类是干什么的

Asset是一个浏览器资源文件。

全栈插件可以贡献浏览器代码。浏览器代码由多个静态资源文件组成。每个文件用Asset表示。

Asset装着文件内容和MIME类型。

Asset是不可变的。类声明用了frozen=True。

浏览器资源有大小限制。单个文件上限4MiB。单个包上限16MiB。文件数上限256。

## 二、类的成员

（一）字段

- content：文件内容字节。
- media_type：MIME类型。类型从文件后缀映射。支持的类型有js、css、json、wasm、图片、字体等。

## 三、它和谁协作

（一）产生者

load_browser_assets函数产生Asset。加载时按清单读文件。加载时校验路径、大小、MIME类型。

（二）承载者

LoadedBrowserAssets的files映射持有Asset。files是只读映射。

## 四、重要性评级

评级：2分。

理由：Asset只是一个两字段的文件数据类。加载和校验逻辑都在load_browser_assets函数里。但它是浏览器资源的承载单元。给2分。
