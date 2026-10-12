# 安装和使用技能仓库 {#installing-and-using-the-skills-repository}

一个技能是一个包含 `SKILL.md` 文件的目录，可选地与 `scripts/` 和 `references/` 目录一起。仓库 `https://github.com/risense-ai/skills` 包含 Respire 技能库。本页解释用户如何安装和使用该仓库中的技能。

## 原理 {#principle}

- 一个技能是一个目录加上 `SKILL.md`。主机（如 opencode）会递归扫描技能目录中的 `**/SKILL.md`，并加载所有匹配项。
- `SKILL.md` 中的 `description` 字段包含触发词。安装后，AI 会在用户说出触发短语时调用技能；用户无需输入命令。
- 因此，安装是两种选择之一：将技能放在主机扫描的目录中，或注册仓库目录为扫描路径。

## 先决条件 {#prerequisites}

- 已安装主机；本页以 opencode 为例。查看 [入门指南](../getting-started.md) 获取 CLI。
- 方法 A 和 B 需要 `git`；方法 C 需要 `Node` 和 `npx`。
- 必须能访问 GitHub；连接失败属于故障排除范围。

## 安装方法 {#installation-methods}

| 方法 | 机制 | 范围 |
| --- | --- | --- |
| A | 在 opencode 的 `skills.paths` 中注册克隆的仓库 | 整个仓库 |
| B | 将一个技能目录复制到 opencode 默认技能目录 | 单个技能 |
| C | 将第三方 `skills` CLI 安装到共享外部位置 | 单个技能 |
| D | 其他主机和共享外部位置 | 主机依赖 |

### 整个仓库安装 {#whole-repository-install}

克隆仓库，然后在配置中将该目录注册为技能路径：

```bash
git clone https://github.com/risense-ai/skills <local-directory>
```

编辑全局配置文件，位置如下：

- Windows: `C:\Users\<user>\.config\opencode\opencode.jsonc`
- macOS 和 Linux: `~/.config/opencode/opencode.json(c)`

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "skills": {
    "paths": ["<absolute path to the cloned directory>"]
  }
}
```

该目录下的所有技能（包括嵌套子目录）都将可用。

### 单个技能安装 {#single-skill-install}

仅将所需技能目录复制到 opencode 默认技能位置：

```bash
git clone --depth 1 https://github.com/risense-ai/skills /tmp/risense-skills
cp -r /tmp/risense-skills/<skill-name> ~/.config/opencode/skills/
```

目录 `~/.config/opencode/skills/` 是 opencode 的默认扫描位置。

### 使用 skills CLI 的单命令安装 {#one-command-install-with-the-skills-cli}

```bash
npx --yes skills add risense-ai/skills --skill <skill-name> --agent opencode -g -y
```

- 技能将安装到 `~/.agents/skills/<skill-name>/`，opencode 会自动加载。
- `-g` 选择全局安装；`-y` 跳过提示，在非交互环境中必需。

### 其他主机和共享位置 {#other-hosts-and-shared-locations}

- Claude Code 和遵循 Agent Skills 约定的主机读取 `~/.claude/skills/<name>/SKILL.md`。
- 共享外部位置 `~/.agents/skills/<name>/SKILL.md` 也被 opencode 读取。
- 技能目录也可放置在任意位置并通过主机等效机制注册，例如 opencode 的 `skills.paths`。

## 激活和验证 {#activation-and-verification}

- 重启主机。opencode 仅在启动时加载技能和配置；运行中的会话不会热加载。
- 通过以下命令验证安装：

```bash
opencode debug skill
```

该命令列出所有加载技能的 `name`、`description` 和 `location`。确认目标技能出现且其 `location` 指向安装目录。

## 使用 {#usage}

安装后无需输入命令。向 AI 说出触发短语，短语写在技能 `description` 中：

> "批量整理提取的记忆"

显式命名技能也更可靠：

> "使用 memory-batch-tidy 附加提取的会话根目录"

## 升级 {#upgrade}

- 方法 A：在克隆目录中运行 `git pull`，然后重启主机。
- 方法 B 和 C：重新运行安装命令；它会覆盖现有副本。

## 卸载 {#uninstall}

- 删除技能目录，即 `~/.config/opencode/skills/<name>/` 或 `~/.agents/skills/<name>/`。
- 或从 `opencode.json(c)` 的 `skills.paths` 中移除仓库目录。
- 重启主机。

## 故障排除 {#troubleshooting}

- GitHub 连接超时：在运行 `git` 或 `npx` 前通过代理路由，例如 `set HTTPS_PROXY=http://127.0.0.1:7890`，替换为您的代理地址。
- `npx` 挂起等待输入：添加 `-y`；如需，设置 `NODE_TLS_REJECT_UNAUTHORIZED=0`。
- 已安装但未激活：主机可能未重启，或路径错误或未扫描。使用 `opencode debug skill` 检查 `location`。
- 同名技能重复：同一名称仅一个副本生效。避免在多个扫描位置放置同名目录。

## 仓库技能 {#repository-skills}

| 技能 | 用途 | 触发短语 |
| --- | --- | --- |
| `memory-batch-tidy` | 批量整理由 `rsrs extract` 导入的会话摘要根条目到树中 | 整理提取的记忆；批量整理会话导入 |

查看 [批量整理提取的记忆](batch-tidy-extracted.md) 了解工作流程。该技能补充 CLI 内存命令；查看 [插件](../plugin-dev.md) 了解基于钩子的扩展点。新增技能的规范在仓库 `README.md` 中有文档。
