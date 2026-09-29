# LoadedBrowserAssets档案

源码位置：backend/packages/harness/deerflow/extensions/browser_assets.py

## 一、这个类是干什么的

LoadedBrowserAssets是加载好的浏览器资源包。

全栈插件贡献浏览器资源。资源声明先由load_browser_assets加载。加载完成后产出LoadedBrowserAssets。LoadedBrowserAssets是一个有界的、不可变的启动快照。

LoadedBrowserAssets继承自BrowserAssets。BrowserAssets是extension-api的公开声明类。LoadedBrowserAssets加上了实际加载后的内容。

LoadedBrowserAssets的核心字段是revision。revision是整个资源包的哈希。哈希从清单和每个文件的内容计算。revision用于资源版本识别。浏览器端可以用revision判断资源是否变化。

LoadedBrowserAssets的files是只读映射。files用了MappingProxyType。外面改不了。

## 二、类的成员

（一）字段

- entry：入口JS模块。必须是清单里列出的JavaScript模块。
- revision：资源包的哈希。从清单和文件内容计算。SHA-256。
- files：文件映射。路径到Asset。只读映射。

（二）继承字段

- module：浏览器模块名。
- root：资源根目录。
- manifest：清单路径。
- public_fields：公开字段允许列表。

## 三、它和谁协作

（一）产生者

load_browser_assets函数产生LoadedBrowserAssets。加载过程校验清单结构、路径合法性、符号链接、大小限制、MIME类型。

（二）承载

ExtensionRegistry的plugin方法把LoadedBrowserAssets放进插件贡献。Gateway的plugins路由服务这些资源。

## 四、重要性评级

评级：3分。

理由：LoadedBrowserAssets是浏览器资源的运行期快照。revision哈希和只读映射是两处细致设计。它是数据快照，不承载加载逻辑。给3分。
