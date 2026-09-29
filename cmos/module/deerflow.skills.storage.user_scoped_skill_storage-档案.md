# deerflow.skills.storage.user_scoped_skill_storage

## 一、这个模块是干什么的

这个模块是按用户隔离的技能存储。

背景是这样的。

自定义技能原来放在全局目录。

多用户部署时出问题了。

两个用户可以各有一份同名技能。

全局目录装不下两份。

这个类把自定义技能按用户隔离。

布局是这样的。

公开技能仍在全局目录。

公开技能只读。

用户自定义技能放在用户自己的目录。

用户自定义技能可读写。

集成技能放在全局只读目录。

用户还有一份技能开关状态文件。

开关状态按用户存。

公开技能的开关仍存在全局的extensions_config里。

这防止了跨用户串扰。

还有一个迁移回退。

用户还没有自定义技能时。

全局的custom技能会以LEGACY分类出现。

LEGACY技能只读。

用户能看到但改不了删不了。

这保住了向后兼容。

LEGACY技能在沙箱里挂到legacy目录。

代理能读到它的支持文件。

## 二、模块里的主要成员

- UserScopedSkillStorage：按用户隔离的存储类。继承LocalSkillStorage。
- 布局由四个目录组成。全局public、用户custom、全局integrations、用户history。
- 技能加载按分类遍历。PUBLIC、CUSTOM、LEGACY各自处理。
- 技能开关状态存在用户的_skill_states.json里。按技能名做键。
- 写入和删除只允许CUSTOM分类。LEGACY和PUBLIC只读。
- 遍历同样跟随目录链接并剪掉回指祖先的链接。

## 三、它和谁协作

- 它继承skills/storage/local_skill_storage.py。
- 它被skills/storage的工厂函数按需选择。
- 它被sandbox provider引用，构建用户的技能挂载。
- 它被skill工具和skill激活中间件引用。

## 四、重要性评级

评级是7分。

理由是多用户部署依赖它。

没有按用户隔离，同名技能会互相覆盖。

LEGACY回退保住了老部署的兼容性。

开关状态按用户存防止跨用户串扰。

它是技能存储在多用户场景下的正确形态。
