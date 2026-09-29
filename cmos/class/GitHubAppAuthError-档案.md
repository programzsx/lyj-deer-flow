# GitHubAppAuthError-档案

## 一、这个类是干什么的

GitHubAppAuthError是app/gateway/github/app_auth.py里的异常类。

它继承RuntimeError。

它在GitHub App凭据缺失或无效时抛出。

这个类位于backend/app/gateway/github/app_auth.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、继承关系

GitHubAppAuthError继承RuntimeError。

### 2、抛出场景

GITHUB_APP_ID环境变量未设置时抛出。

GITHUB_APP_ID不是整数时抛出。

GITHUB_APP_PRIVATE_KEY和GITHUB_APP_PRIVATE_KEY_PATH都未设置时抛出。

GITHUB_APP_PRIVATE_KEY_PATH指向不存在的文件时抛出。

installation token铸造失败时抛出。状态码非201。

installation_id非正数时抛出。

### 3、错误消息

每个场景带具体原因。

未设置时消息包含环境变量名。

铸造失败时消息包含状态码和响应body。

## 三、它和谁协作

- app_id、load_app_private_key、mint_app_jwt、mint_installation_token、_request_new_installation_token都抛它。
- 调用方是GitHub webhook和REST调用路径。

## 四、重要性评级

评级是4分。

理由如下。

这个类是GitHub App认证的错误信号。

凭据缺失和铸造失败都收敛到它。

错误消息带环境变量名和状态码。方便排障。

扣掉6分。

扣分原因是它是单行异常类。逻辑量小。
