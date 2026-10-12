# Installing and using the skills repository

A skill is a directory that contains a `SKILL.md` file, optionally alongside `scripts/` and `references/`. The repository `https://github.com/risense-ai/skills` holds the Respire skill library. This page explains how a user installs and uses the skills from that repository.

## Principle

- A skill is one directory plus `SKILL.md`. A host, such as opencode, recursively scans skill directories for `**/SKILL.md` and exposes every match with its `name`, `description` and `location`.
- The `description` field in `SKILL.md` contains trigger words that guide the model. The model loads a skill on demand, so a trigger phrase is guidance rather than a guaranteed activation; naming the skill explicitly is more reliable.
- Installation is therefore one of two choices: place the skill in a directory the host scans, or register the repository directory as a scan path.

## Prerequisites

- A host is installed; this page uses opencode as the example. See [Getting started](../getting-started.md) for the CLI.
- `git` is required for methods A and B; `Node` and `npx` are required for method C.
- GitHub must be reachable; connection failures are covered under troubleshooting.

## Installation methods

| Method | Mechanism | Scope |
| --- | --- | --- |
| A | Register the cloned repository in opencode `skills.paths` | Whole repository |
| B | Copy one skill directory into the opencode default skills directory | Single skill |
| C | Third-party `skills` CLI into a shared external location | Single skill |
| D | Other hosts and shared external locations | Host dependent |

### Whole repository install

Clone the repository, then register that directory as a skill path in the configuration:

```bash
git clone https://github.com/risense-ai/skills <local-directory>
```

Edit the global configuration at one of these locations:

- Windows: `C:\Users\<user>\.config\opencode\opencode.jsonc`
- macOS and Linux: `~/.config/opencode/opencode.json(c)`

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "skills": {
    "paths": ["<absolute path to the cloned directory>"]
  }
}
```

Every skill under that directory, including nested subdirectories, becomes available.

### Single skill install

Copy only the wanted skill directory into the opencode default skills location:

```bash
git clone --depth 1 https://github.com/risense-ai/skills /tmp/risense-skills
cp -r /tmp/risense-skills/<skill-name> ~/.config/opencode/skills/
```

The directory `~/.config/opencode/skills/` is the default scan location for opencode.

### One command install with the skills CLI

```bash
npx --yes skills add risense-ai/skills --skill <skill-name> --agent opencode -g -y
```

- The skill is installed to `~/.agents/skills/<skill-name>/`, which opencode loads automatically.
- `-g` selects a global install; `-y` skips prompts and is required in non-interactive environments.

### Other hosts and shared locations

- Claude Code and hosts that follow the Agent Skills convention read `~/.claude/skills/<name>/SKILL.md`.
- The shared external location `~/.agents/skills/<name>/SKILL.md` is also read by opencode.
- A skill directory may also be placed anywhere and registered through the host equivalent mechanism, such as opencode `skills.paths`.

## Activation and verification

- Restart the host. opencode loads skills and configuration only at startup; a running session does not hot-reload them.
- Verify the installation with:

```bash
opencode debug skill
```

The command lists the `name`, `description` and `location` of every loaded skill. Confirm that the target skill appears and that its `location` points to the installed directory.

## Usage

After installation, no command is required. Say a trigger phrase to the AI, where the phrase is written in the skill `description`:

> "bulk tidy extracted memories"

Naming the skill explicitly is also possible and is more reliable:

> "use memory-batch-tidy to attach the extracted session roots"

## Upgrade

- Method A: run `git pull` inside the cloned directory, then restart the host.
- Methods B and C: re-run the installation command; it overwrites the existing copy.

## Uninstall

- Delete the skill directory, either `~/.config/opencode/skills/<name>/` or `~/.agents/skills/<name>/`.
- Or remove the repository directory from `skills.paths` in `opencode.json(c)`.
- Restart the host.

## Troubleshooting

- GitHub connection times out: route through a proxy before running `git` or `npx`. In PowerShell set `$env:HTTPS_PROXY = "http://127.0.0.1:7890"`; in bash or zsh use `export HTTPS_PROXY=http://127.0.0.1:7890`. Replace the address with your proxy.
- `npx` hangs waiting for input: add `-y`. If certificate errors appear, configure your proxy's trusted CA (for example, `NODE_EXTRA_CA_CERTS`) instead of disabling TLS verification.
- Installed but inactive: the host was probably not restarted, or the path is wrong or not scanned. Check `location` with `opencode debug skill`.
- Duplicate same-name skills: only one copy of a given name takes effect. Avoid placing directories with the same name in multiple scan locations.

## Repository skills

| Skill | Purpose | Trigger phrases |
| --- | --- | --- |
| `memory-batch-tidy` | Batch-tidy the session-summary root entries imported by `rsrs extract` into the tree | tidy extracted memories; bulk tidy session imports |

See [Batch-tidying extracted memories](batch-tidy-extracted.md) for the workflow. The skill complements the CLI memory commands; for hook-based extension points see [Plugins](../plugin-dev.md). Conventions for adding new skills are documented in the repository `README.md`.
