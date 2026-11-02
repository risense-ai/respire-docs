# 批量整理提取的记忆 {#batch-tidying-extracted-memories}

`rsrs extract` 可导入会话摘要。未指定父节点时，摘要会成为根节点。本页介绍如何检查并用 `resort` 分批归档。原本无父节点的条目不能通过重新挂接精确还原。

## 问题 {#the-problem}

默认导入使用 `--importance important`，未指定父节点时成为根节点。

批量导入可能一次添加数百个根节点。这些根节点不会被报告为孤儿：`audit` 仅在父节点 ID 悬挂时才将条目标记为孤儿，而根节点不是孤儿，因此 `audit` 可能全部显示绿色，但树结构仍可能碎片化。

## 为什么标准整理无法解决此问题 {#why-the-standard-tidy-does-not-fix-it}

内置的整理命令不会自动附加未父节点的导入条目：

| 命令 | 行为 |
| --- | --- |
| `classify --plan` | 仅限本地；不执行语义分组，因此通常不会提出任何建议 |
| `classify --tree --auto` | 需要可用的分类后端；可使用 `classify-config` 查看配置 |

可根据工作目录和关键词人工分类，再用 `resort` 批量附加。先核对每条记录。

## 确定性分类 {#deterministic-classification}

该流程按规则分配归档锚点，创建锚点后通过 `resort --spec` 附加子节点。只有 `resort` 自身默认预览，创建锚点会写入。写入前请备份。

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

选择批量处理范围。`--since-resort` 筛选上次整理后创建的记录；`--since 1900` 指定较早的下界。`--limit` 会截断结果，创建时间为空的旧记录也会被排除。

```sh
rsrs list --since-resort --limit 500 --json
rsrs list --since 1900 --limit 5000 --json
```

`rsrs list --json` 的 `details` 包含完整记录；使用 `rsrs show <id> --json` 检查具体条目。

### 诊断树结构 {#diagnose-the-tree}

在更改任何内容前收集当前树信号：

```sh
rsrs audit --json
rsrs tree-cure
rsrs defrag
```

逐条检查同标题组和 defrag 相似簇；相似本身不能证明重复。请检查真实重复、错误或损坏的链接以及分散的根节点。

### 备份数据 {#back-up-the-data}

写入前请将明文导出到持久目录，每次使用新路径，因为导出会覆盖已有文件。请限制对目录的访问，并在适当情况下加密。

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

干运行报告 `status=pending` 和 `moved=N`。写入报告 `status=ok`、`moved=N` 和 `counter=reset`。请将大量操作分批：安全大小取决于 JSON 和平台的命令行长度限制。写入前检查每一批。PowerShell 可能丢失 JSON 参数中的引号，因此宜通过脚本的参数列表传递。

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
| 同标题组 | `rsrs audit --json` | 逐条检查；同标题不能证明重复 |
| 截断标题 | `rsrs audit --json` | 导入过程中标题被截断；编辑前需审查 |
| 最大深度 | `rsrs audit --json` | 树的整体深度用于上下文 |
| 整理簇 | `rsrs defrag` | 相似簇合并前需要逐条检查 |

## 命令速查表 {#command-cheat-sheet}

| 目的 | 命令 |
| --- | --- |
| 选择一批数据 | `rsrs list --since-resort --limit 500 --json` |
| 按较早日期选择 | `rsrs list --since 1900 --limit 5000 --json` |
| 诊断 | `rsrs audit --json`, `rsrs tree-cure`, `rsrs defrag` |
| 备份 | `rsrs export <persistent-dir>/memories_YYYYMMDD.json` |
| 创建锚点 | `rsrs remember "<purpose>" --title "Session archive: <project>" --importance important --parent <tree-name-or-id> --json` |
| 预览挂载 | `rsrs resort --spec '<JSON>' --json` |
| 应用挂载 | `rsrs resort --spec '<JSON>' --go --json` |
| 重置计数器 | `rsrs resort --reset` |
| 读取节点 | `rsrs show <id> --json` |
| 读取子树 | `rsrs tree --from <id> --depth 3 --json` |

## 单命令辅助脚本 {#single-command-helper-script}

技能仓库中的 `memory-batch-tidy/scripts/tidy_extracted.py` 仅供审查，不建议直接运行：预览也会创建锚点，重复运行会覆盖同一路径的明文导出，而且同名锚点可能被错误复用。脚本不会分块，也不保存逐条撤销计划。请手动检查目标并使用不同的受保护备份路径。

## 常见陷阱 {#common-pitfalls}

1. 先预览。`resort` 默认不写入；确认 `status=pending` 和 `moved=N` 后再添加 `--go`。
2. `resort --go` 会重置 TIDY 计数器并报告 `counter=reset`。这是预期行为，无需单独使用 `--reset`。
3. 同标题不能证明重复。请逐条检查 `same_title_groups`。
4. 相似不能证明重复。合并前请检查 defrag 相似簇及其上下文。
5. 合并前备份并记录子节点。`remember --merge-ids` 会删除旧条目；请检查结果并重新附加孤立的子节点。
6. 引号。通过 PowerShell 将包含引号的 JSON 字符串传递给原生程序可能导致引号丢失；改用参数列表传递。
7. 控制台编码。Windows 上输出编码因环境而异；必要时设置 `PYTHONIOENCODING=utf-8`。
8. 过大的批次。请按平台限制拆分规格，并将导出和备份保存在持久目录中。

## 回滚 {#rollback}

可通过另一 `resort` 调用将每个子节点重新指向其记录的原始父节点来撤销附加。将子节点指向目标树根不会恢复原本无父节点的条目，因此这不是精确回滚。

可通过 `rsrs forget <anchor-id>` 删除空锚点，通过 `rsrs restore <full-id>` 恢复软删除条目。

`rsrs import` 会生成新 ID 并追加副本，不会原地恢复。也可在写入前创建 `rsrs snapshot create` 数据库快照；恢复不会回滚服务端，且会隔离同步。请先阅读 [快照说明](https://github.com/risense-ai/respire-cli/blob/main/docs/snapshots.md)。保留备份，因为无法保证每次修改都有可恢复版本。

## 相关页面 {#related-pages}

[入门指南](../getting-started.md), [CLI 命令](../cli.md), [CLI JSON](../cli-api.md), [技能仓库](skills-repo.md)
