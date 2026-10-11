# 记忆关联 {#memory-associations}

Recall 保留原有排序后的 `details` 数组，并在独立的 `related` 数组中追加数量受限、仅含标题的关联。每个关联包含 `id`、`title`、`source_id` 及 `relation`：`new_version`、`old_version`、`see_also`、`co_recall` 或 `neighbor`。正文须用 `show` 读取；标题属于不可信数据。Summary 分别统计原始命中与关联。Recall detail 行的 `superseded_by` 及文本标记 `[superseded]` 表示存在有效替代记录。替代链解析到最新的存活端点。

```sh
rsrs remember "Revised conclusion" --title "Current decision" --importance important --supersedes OLD_ID
rsrs remember "Related evidence" --title "Supporting evidence" --importance important --see-also ID_A,ID_B
rsrs recall "query" --titles --json
rsrs recall "query" --no-related --titles --json
```

显式关系选项表示有意新增写入，会绕过判重建议。两个选项都拒绝日记记忆，且不能与 `--merge-ids` 同用。ID 必须解析到存活的 important 记录。生成 embedding 或保存前验证目标；新记录与所有反向链接一起提交或一起回滚。只改元数据的反向编辑保留不透明 Core 索引数据；SQLite 将其来源重新绑定到新密文。

Fast 和 quality 模式只扩展最终选中的命中。模型选择仍只接收已有的查询/标题材料。关系优先级、邻居推断、排除规则、范围过滤与预算归 Core 所有。不返回向量、中间 cosine 值、策略阈值或 selector 计划。关联不改变主要命中的 ID 与分数。

`--no-related` 禁用当前请求的扩展与替代提示。宿主兼容环境开关 `RSRS_RELATED=0` 禁用扩展，但保留替代警告；进程环境变更需要宿主所有者重启 runtime。宿主向 Core 传递显式关联设置；关联策略由 Core 负责，Core 不读取环境变量。

共同召回证据存于本地 SQLite 表 `recall_pairs`，不是同步内容。前五个最终命中 ID 形成不同的无序对；每对在一次 recall 中只递增一次。关联 ID 不进入统计。CLI 复用已有、容量受限的异步统计队列及其失败诊断。立即重复查询时，排队中的统计可能尚未保存。

## 数据兼容性 {#data-compatibility}

加密 payload 增加默认空的 `supersedes`、`superseded_by` 与数组 `see_also` 字段。序列化时省略空字段。旧密文仍可读；服务端密文传输契约不变。正向 `supersedes` 边是权威依据。反向字段仅作提示：跨设备 LWW 同步可能暂时拆开多记录事务。Core 根据正向边推导有效替代关系，按时间戳与 ID 确定性地解决多个存活写入者的竞争，并抑制环状替代声明。已删除或超出范围的目标不会注入，也不会用于警告。

Import/share 创建新 ID，只重映射已包含的关系目标。分享省略外部目标。导入拒绝自链接、竞争替代与环。Merge 保留仍有效的链接，并在移动子节点和写 tombstone 的同一事务中，将引用改向替代记录；不能隐式合并不同的外部替代链。删除保留加密关系以便恢复；非活动端点仍不参与 recall。

新增关系写入要求 Core SDK 声明 `related_business`。由于符号及调用约定未变，C ABI 与请求 envelope 版本保持不变；新操作是增量添加。构造 MemoryEntry/PayloadV2 字面量的 Rust 调用者必须提供三个新字段。Rust 协议与 binding 对此结构体字面量 API 变更采用 2.0 开发版 crate 版本；它们的版本与二进制 SDK 独立。**旧写入者重新封装时可能丢弃未知 payload 字段。对共享记忆库启用关系前，先升级全部写入者。** 不透明同步服务端不能强制保留加密 payload 字段。不会自动回填旧正文尾注关系，因为文字引用需要审阅。

## SDK 兼容性与验证 {#sdk-compatibility-and-validation}

CLI 要求各目标 SDK 支持 association contract 1。使用配套七平台 SDK 发布中的精确 manifest 与归档固定版本。打包 CLI 时保留其 runtime 库、许可证及第三方声明。

使用现有 workspace 测试及 SDK 原生调用者检查。在相同记忆库/模型下比较检索基准，并比较启用/禁用关联时的端到端回答质量。稳定的 hit@5 测量原始排序，不衡量新增关联是否正确或有用。付费 selector/provider 质量评估需要明确授权的 provider 与评估语料。
