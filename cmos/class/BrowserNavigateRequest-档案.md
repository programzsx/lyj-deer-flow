# BrowserNavigateRequest档案

类定义在backend/app/gateway/routers/browser.py。

## 一、这个类是干什么的

这个类是实时浏览器导航的请求体。

DeerFlow可以实时控制浏览器。用户想让对话的浏览器会话打开一个网页。

前端调用浏览器导航接口。后端用这个类接收网址。这个类是一个Pydantic模型。

这个类只有1个字段。

## 二、类的成员

这个类有1个字段。

### 1、url

url是要打开的网址。

这个字段是字符串类型。这个字段必填。

网址必须是http或https。浏览器会话绑定到对话。

## 三、它和谁协作

这个类被浏览器导航路由使用。

浏览器接口是可选开放的功能。操作者必须在config.yaml里启用browser_navigate工具。仅仅能导入Playwright不够。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是3分。

理由如下。

实时浏览器控制是可选功能。这个类只有1个字段。

浏览器控制有安全边界。只有明确启用的操作才开放。

所以评3分。
