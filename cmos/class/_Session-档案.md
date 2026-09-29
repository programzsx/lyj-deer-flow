# _Session档案

## 一、这个类是干什么的

_Session是一次微信二维码登录会话的数据记录。

管理员发起微信扫码连接。

每一次登录尝试对应一个会话。

这个类保存那次会话的全部状态。

它是模块内部辅助类。

名字以下划线开头。

它定义在wechat_qr_login.py里。

它是一个数据类。

## 二、类的成员

### （一）字段

1、owner

会话的属主。

是发起登录的管理员标识。会话只属于这个管理员。

2、config

登录用的渠道配置。

轮询状态时可能更新里面的base_url。

3、id

会话id。

用secrets.token_urlsafe生成的安全随机串。

4、expires_at

过期时间。

默认180秒。

5、status

会话状态。

取值包括pending、scanned、verification_required、confirmed、failed、expired。

6、qrcode

二维码标识。

iLink返回的qrcode。

7、content

二维码内容。

发给浏览器展示的二维码图片内容。

8、provider

凭据应用后的渠道提供者信息。

9、error

错误标记。

比如network、invalid_response、verification_rejected。

10、verify_code

验证码。

需要验证码时浏览器提交的数字串。

### （二）方法

1、response()

生成发给浏览器的响应字典。

包含会话id、状态、二维码内容、剩余有效秒数、提供者信息、错误标记。不包含令牌。

## 三、它和谁协作

_Session是微信二维码登录的会话数据。

它由WechatQRLogin的start创建。

它被WechatQRLogin的_get查找和校验。

它被poll方法消费。扫码状态的每次变化都更新它的字段。

它被cancel方法清空。

它是模块内部类，只在wechat_qr_login.py里使用。

## 四、重要性评级

评级：3分。

理由如下。

它承载了一次扫码登录的完整状态。

它的字段设计保证了令牌不会通过response泄露给浏览器。

它只是被动数据，没有业务逻辑。所有状态转换都在WechatQRLogin的poll方法里。

它是模块内部的小数据类，只在微信扫码登录场景里生效。所以只有3分。
