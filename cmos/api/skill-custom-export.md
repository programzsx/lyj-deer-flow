# 下载自定义技能导出归档接口

## 接口地址

- 请求方法是GET。
- 完整路径是`/api/skills/custom/{skill_name}/export`。
- 网关端口是8001。
- 完整URL示例是`http://localhost:8001/api/skills/custom/my-report/export?expected_revision=abc`。
- 路径参数`skill_name`是自定义技能的名称。

## 接口鉴权

- 本接口使用session cookie认证。
- cookie名称是`access_token`。
- cookie由`POST /api/v1/auth/login/local`登录接口创建。
- 源码权限校验是`require_admin_user`。
- 本接口是admin专属接口。调用者必须是管理员。
- 非管理员返回403。错误信息是`Admin privileges required to manage skills.`。
- PAT Bearer调用会返回403。PAT凭据不携带管理员能力。
- 技能不存在时返回404。detail包含错误码和错误信息。
- 修订标识不匹配时返回409。表示技能内容在预览后发生了变化。
- 导出槽位占用时返回429。本网关进程同时只有2个导出槽位。

## 请求入参

- 本接口没有请求体。
- 查询参数有1个。
- 路径参数`skill_name`是自定义技能名称。

参数说明：

- `expected_revision`：字符串。必填。预期修订标识。格式是64位小写十六进制的SHA-256。取值来自导出清单接口的`revision`字段。

行为说明：

- 本接口返回`.skill`归档文件。
- 归档媒体类型是`application/zip`。
- 响应带有`Content-Disposition: attachment`头。文件名是`{skill_name}.skill`。
- 响应带有`Cache-Control: private, no-store`和`X-Content-Type-Options: nosniff`头。
- 客户端提前断开时返回204。

## 响应出参

- 响应体是ZIP格式的`.skill`归档文件。二进制内容。
- 不使用JSON结构描述。

## curl命令

```bash
curl -X GET "http://localhost:8001/api/skills/custom/my-report/export?expected_revision=<revision>" \
  -b "access_token=<token>" \
  -OJ
```
