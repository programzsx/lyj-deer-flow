# 准备编辑后重跑最新用户轮次

## 接口地址

接口地址是`POST /api/threads/{thread_id}/runs/edit-regenerate/prepare`。
网关端口是8001。
完整地址是`http://localhost:8001/api/threads/{thread_id}/runs/edit-regenerate/prepare`。
路径参数`thread_id`是线程ID。线程ID匹配`^[A-Za-z0-9_-]{1,64}$`。

## 接口鉴权
这个接口需要登录。
认证方式支持两种。
第一种是session cookie的`access_token`。
第二种是PAT的`Authorization: Bearer dfp_...`。
需要的权限是`runs:create`。
这个接口要求调用者是线程的所有者。线程必须已存在。
token来源是`POST /api/v1/auth/login/local`。
用session cookie发起POST请求时需要携带`X-CSRF-Token`头。
用PAT认证可以跳过CSRF校验。

## 请求入参
请求体来自`EditRegeneratePrepareRequest`模型。
- `human_message_id`：字符串。必填。要编辑重跑的源用户消息ID。最小长度1。
- `replacement_text`：字符串。必填。替换后的用户可见文本。最小长度1。

请求示例JSON。
```json
{
  "human_message_id": "human-msg-001",
  "replacement_text": "改成帮我总结这份文档的第二章"
}
```

## 响应出参
响应体来自`EditRegeneratePrepareResponse`模型。响应示例来自源码响应模型推导。
- `input`：对象。编辑重跑用的图输入。包含`messages`。回放基础有标题时还包含`title`。
- `checkpoint`：对象。回放基础检查点。包含`checkpoint_ns`、`checkpoint_id`、`checkpoint_map`。
- `metadata`：对象。编辑回放元数据。包含`replay_kind`、`regenerate_from_message_id`、`regenerate_from_run_id`、`regenerate_checkpoint_id`、`edit_from_message_id`、`edit_message_id`、`edit_version_group_id`。
- `target_run_id`：字符串。源运行ID。
- `replacement_human_message_id`：字符串。新替换消息的ID。服务端生成的UUID。
- `source_message_ids`：字符串数组。源轮次中全部消息的ID。

只允许编辑最近一轮已完成的用户轮次。目标是活跃目标时返回409。消息未变化或为空返回409。源运行不是成功状态返回409。
响应示例。
```json
{
  "input": {
    "messages": [
      {
        "type": "human",
        "id": "0c9d8e7f-6a5b-4c3d-8e9f-0a1b2c3d4e5f",
        "content": [{"type": "text", "text": "改成帮我总结这份文档的第二章"}],
        "additional_kwargs": {}
      }
    ],
    "title": "文档总结"
  },
  "checkpoint": {
    "checkpoint_ns": "",
    "checkpoint_id": "1f0f1e0d-2c3b-4a5f-8e9d-0a1b2c3d4e5f",
    "checkpoint_map": null
  },
  "metadata": {
    "replay_kind": "edit",
    "regenerate_from_message_id": "ai-msg-001",
    "regenerate_from_run_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "regenerate_checkpoint_id": "1f0f1e0d-2c3b-4a5f-8e9d-0a1b2c3d4e5f",
    "edit_from_message_id": "human-msg-001",
    "edit_message_id": "0c9d8e7f-6a5b-4c3d-8e9f-0a1b2c3d4e5f",
    "edit_version_group_id": "human-msg-001"
  },
  "target_run_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "replacement_human_message_id": "0c9d8e7f-6a5b-4c3d-8e9f-0a1b2c3d4e5f",
  "source_message_ids": ["human-msg-001", "ai-msg-001"]
}
```

## curl命令
```bash
curl -X POST "http://localhost:8001/api/threads/f47ac10b-58cc-4372-a567-0e02b2c3d479/runs/edit-regenerate/prepare" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"human_message_id": "human-msg-001", "replacement_text": "改成帮我总结这份文档的第二章"}'
```
