# _ScreenshotEncoding-档案

## 一、这个类是干什么的

_ScreenshotEncoding是community/browser_automation/tools.py里的冻结数据类。

它表示截图的编码配置。

字段是image_type加suffix加quality。

这个类位于backend/packages/harness/deerflow/community/browser_automation/tools.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、字段

image_type是ScreenshotType。图片类型。

suffix是文件后缀。

quality是质量。可None。

### 2、_PROGRESS_SCREENSHOT_ENCODING常量

它用_ScreenshotEncoding(image_type="jpeg", suffix=".jpg", quality=80)。

进度截图用jpeg。质量80。

### 3、进度截图的定位

每步自动截图是实时进度反馈。显示在浏览器面板和内联缩略图。

不是deliverable。

它们放在隐藏子目录里。workspace-changes review不会把它们列为文件变化。

目录名是共享常量。BROWSER_FRAMES_DIRNAME。

scanner的ignore列表不能漂移。

## 三、它和谁协作

- browser工具的每步截图用它。
- BROWSER_FRAMES_DIRNAME是共享常量。
- workspace_changes的scanner排除frames目录。

## 四、重要性评级

评级是3分。

理由如下。

这个类是截图编码的配置载体。

三个字段。image_type加suffix加quality。

进度截图用jpeg质量80。

配合隐藏子目录让进度截图不进文件变更review。

扣掉7分。

扣分原因是它是小配置载体。
