# 批量整理提取的记忆 {#batch-tidying-extracted-memories}

`rsrs extract` 从支持的平台导入会话并为每个会话写入一个摘要记忆。每个摘要在创建时都没有父节点，因此大量导入会导致许多分散的根节点。本文描述了一种确定性、无需模型的方法，通过 `resort` 将这些根节点统一归档到锚点下并一次性附加。该方法可通过另一 `resort` 调用撤销，且不依赖任何模型服务。

## 问题 {#the-problem}

每个会话导入都会生成一个摘要，其内容记录了源平台和会话 ID、工作目录、模型、第一条指令和最后更新时间。摘要使用 `--importance important` 写入且没有解析的父节点，因此每个条目都成为根节点。批量导入可能一次添加数百个根节点。这些根节点不会被报告为孤儿：`audit` 仅在父节点 ID 悬挂时才将条目标记为孤儿，而根节点不是孤儿，因此 `audit` 可能全部显示绿色，但树结构仍可能碎片化。

## 为什么标准整理无法解决此问题 {#why-the-standard-tidy-does-not-fix-it}

内置的整理命令不会自动附加未父节点的导入条目：

| 命令 | 行为 |
| --- | --- |
| `classify --plan` | 仅限本地；不执行语义分组，因此通常不会提出任何建议 |
| `classify --tree --auto` | 需要配置分类后端，通过 `classify --ds <key>` 设置 |

由于这两种方式都无法可靠覆盖导入的摘要，应使用确定性分类：为每个条目分配规则，创建归档锚点，然后通过 `resort` 批量附加。结果无需模型且可回滚。

## 确定性分类 {#deterministic-classification}

该流程通过工作目录和关键词规则将每个分散的根节点分配到归档锚点，创建锚点到选定的树根下，并通过单次 `resort --spec` 调用附加所有子节点。`resort` 默认进行预览，仅在使用 `--go` 时写入，因此在预览确认前不会有任何更改。在任何写入前保持完整的导出快照；本地存储没有版本历史记录，`update` 和 `merge` 不可逆。

## 先决条件 {#prerequisites}

开始前确认已安装的选项。本页面未固定版本，请检查本地二进制文件：

```sh
rsrs --version
rsrs --help
rsrs prompt --json
```

然后检查本地存储和整理状态：

```sh
rsrs status
rsrs resort --status
rsrs tree-cure
```

从 `rsrs status` 读取 `data_dir` 并在后续命令中使用该路径。不要从其他设备复制路径。

### 受限和沙盒主机 {#restricted-and-sandbox-hosts}

在受限或沙盒主机上，向本页所有命令添加 `--client-only` 以连接到现有的认证本地运行时。不要使用 `--direct`。如果连接或认证失败，请向主机所有者报告问题而非更改运行时生命周期。

```sh
rsrs --client-only status
rsrs --client-only resort --status
rsrs --client-only tree-cure
```

## 分步流程 {#step-by-step-flow}

### 选择目标 {#select-targets}

选择批量处理范围。`--since-resort` 表示自上次整理以来添加的所有内容，这是默认范围；`--since 1900` 覆盖整个存储。

```sh
rsrs list --since-resort --limit 500 --json
rsrs list --since 1900 --limit 5000 --json
```

输出仅包含简短 ID 和标题，没有父节点或重要性。使用 `rsrs show <id> --json` 读取详细信息。

### 诊断树结构 {#diagnose-the-tree}

在更改任何内容前收集当前树信号：

```sh
rsrs audit --json
rsrs tree-cure
rsrs defrag
```

将大多数相同标题组和 defrag 集群视为误报。真正需要处理的条目类型是真实重复条目、错误附加或损坏的链接以及分散的根节点。

### 备份数据 {#back-up-the-data}

在写入前导出完整的纯文本快照到持久目录。不要使用临时目录。导出包含每条记录的明文，因此请限制对该目录的访问（例如仅限用户的 ACL），并在适当情况下加密。

```powershell
rsrs export C:\Users\<user>\rsrs-backups\memories_YYYYMMDD.json
```

```bash
rsrs export ~/rsrs-backups/memories_YYYYMMDD.json
```

### 创建归档锚点 {#create-archive-anchors}

在目标树根下为每个项目或主题创建一个归档容器。使用 `--parent` 附加每个锚点；永远不要将锚点存储为裸根。`--parent` 接受 ID、八位字符前缀或树名称。

```sh
rsrs remember "<purpose of this archive>" \
  --title "Session archive: <project>" \
  --type context --importance important \
  --parent <tree-root-or-id> --json
```

保持锚点标题在 80 字符以内。锚点是归档容器，不是新的目录节点；仅在显式同意和 `root-create --yes` 时创建新目录节点。

### 定义分类规则 {#define-classification-rules}

根据每个分散根节点的工作目录和关键词决定其锚点，并按从具体到通用的顺序排列规则，以便先测试特定项目再测试共享词汇。当工作目录经常缺失时，回退到标题和正文关键词。

| 归档锚点 | 匹配规则（标题、正文或工作目录） | 备注 |
| --- | --- | --- |
| 会话归档: 项目 A | 项目 A 的唯一关键词 |  |
| 会话归档: 项目 B | 项目 B 的唯一关键词 |  |
| 会话归档: 其他 | 不匹配以上任何内容 | 回退，最后评估 |

### 批量附加 {#attach-in-batches}

`resort --spec` 接受 ID、八位字符前缀或树名称作为 `id` 和 `parent`。默认为干运行；添加 `--go` 进行写入。

```jsonc
{
  "ops": [
    { "id": "<child-short-id>", "parent": "<anchor-short-id>" }
  ]
}
```

```sh
rsrs resort --spec '<JSON>' --json
rsrs resort --spec '<JSON>' --go --json
```

干运行报告 `status=pending` 和 `moved=N`。写入报告 `status=ok`、`moved=N` 和 `counter=reset`。由于 JSON 接近 Windows 命令行长度限制（约 32 KB），每个调用分块处理约 300 条目。通过脚本传递参数列表而非 shell 更适合 PowerShell 中引用 JSON 参数，因为引号可能丢失。

### 验证结果 {#verify-the-result}

重新运行检查并检查每个锚点：

```sh
rsrs audit --json
rsrs tree-cure
rsrs resort --status
rsrs tree --outline --json
```

接受标准：`roots` 明确下降，`lone leaf` 下降到或接近零，`orphans=0`，并且 TIDY 计数器被重置。对于本次操作中新建的空锚点，子节点数必须等于附加到它的根节点数；对于已有子节点的锚点，应比较运行前后子节点数的增量，而非总数。

## 诊断信号 {#diagnosis-signals}

| 信号 | 来源 | 解释 |
| --- | --- | --- |
| 根节点数量 | `rsrs tree-cure` | 无父节点的导入摘要 |
| 孤叶节点 | `rsrs tree-cure` | 作为现有节点下挂载的候选 |
| 孤儿节点 | `rsrs audit --json` | 悬浮的父节点 ID；根节点不计入此处 |
| 同标题组 | `rsrs audit --json` | 通常来自共享摘要首行的误报 |
| 截断标题 | `rsrs audit --json` | 导入过程中标题被截断；编辑前需审查 |
| 最大深度 | `rsrs audit --json` | 树的整体深度用于上下文 |
| 整理簇 | `rsrs defrag` | 相似性簇；大多是误报，不要合并 |

## 命令速查表 {#command-cheat-sheet}

| 目的 | 命令 |
| --- | --- |
| 选择一批数据 | `rsrs list --since-resort --limit 500 --json` |
| 选择整个存储 | `rsrs list --since 1900 --limit 5000 --json` |
| 诊断 | `rsrs audit --json`, `rsrs tree-cure`, `rsrs defrag` |
| 备份 | `rsrs export <persistent-dir>/memories_YYYYMMDD.json` |
| 创建锚点 | `rsrs remember "<purpose>" --title "Session archive: <project>" --importance important --parent <tree-name-or-id> --json` |
| 预览挂载 | `rsrs resort --spec '<JSON>' --json` |
| 应用挂载 | `rsrs resort --spec '<JSON>' --go --json` |
| 重置计数器 | `rsrs resort --reset` |
| 读取节点 | `rsrs show <id> --json` |
| 读取子树 | `rsrs tree --from <id> --depth 3 --json` |

## 单命令辅助脚本 {#single-command-helper-script}

辅助脚本可在同一主机上运行整个序列。它导出快照，查找无父节点的根节点，进行分类，创建或复用锚点，然后预览或写入 `resort --spec`。它并非完全只读：在 `--go` 门控之前，它会用 `remember` 创建任何缺失的锚点，因此预览也可能写入；未提供 `--backup` 时，它会写入临时快照而非持久快照。请提供持久且受保护的 `--backup` 路径并在使用前审查脚本，或先自行创建锚点。

编辑脚本顶部的配置块：

- `PREFIXES` 列出作为分散根节点处理的标题前缀。如果导入条目带有如 `session-import` 的标签，脚本首先检测该标签并使用前缀作为备用方案。
- `TARGET_ROOT` 是创建锚点的树根。使用内置目录名称或节点 ID。
- `ANCHORS` 映射每个主题到其关键词规则。保留最终的备用条目并不要删除它。

```bash
python tidy_extracted.py
python tidy_extracted.py --go
python tidy_extracted.py --rsrs <path-to-rsrs> --client-only --backup <snapshot-path>
```

脚本随附相关技能在 `memory-batch-tidy/scripts/tidy_extracted.py`。参见 [技能仓库](skills-repo.md) 了解周围布局，以及 [CLI 命令](../cli.md) 和 [CLI JSON](../cli-api.md) 了解底层选项。

## 常见陷阱 {#common-pitfalls}

1. 先预览。`resort` 默认不写入；确认 `status=pending` 和 `moved=N` 后再添加 `--go`。
2. `resort --go` 会重置 TIDY 计数器并报告 `counter=reset`。这是预期行为，无需单独使用 `--reset`。
3. 同标题不等于同一条目。摘要共享首行模板，因此 `same_title_groups` 通常是误报。
4. 整理簇大多是误报。绝不要合并目录根节点、同一句子模式的不同部分或树的不同分支。
5. 合并前检查子节点。使用 `remember --merge-ids` 进行真实重复合并会删除旧条目，因此需检查其子节点并立即将任何孤立子节点重新附加到新条目。
6. 引号。通过 PowerShell 将包含引号的 JSON 字符串传递给原生程序可能导致引号丢失；改用参数列表传递。
7. 控制台编码。在 Windows 上，Python 默认使用 cp1252 编码，打印时可能失败；先设置 `PYTHONIOENCODING=utf-8` 或重新配置 stdout 为 UTF-8。
8. 过大的批次。将操作数超过约 300 的规格拆分，并将导出和备份保存在持久目录中。

## 回滚 {#rollback}

可通过另一 `resort` 调用将每个子节点重新指向其记录的原始父节点来撤销附加。将子节点指向目标树根不会恢复原本无父节点的条目，因此这不是精确回滚。

可通过 `rsrs forget <anchor-id>` 删除空锚点，通过 `rsrs restore <full-id>` 恢复软删除条目。

如需精确恢复，请使用备份步骤中的导出快照。它不是原地恢复：`rsrs import` 会生成新 ID 并追加副本，因此将快照导入已更改的库会保留原有条目并产生重复记录。应改为恢复到全新的配置文件。本地存储不保留版本历史记录，因此 `update` 和 `merge` 不可逆，任何写入前都需要备份。

## 相关页面 {#related-pages}

[入门指南](../getting-started.md), [CLI 命令](../cli.md), [CLI JSON](../cli-api.md), [技能仓库](skills-repo.md)
