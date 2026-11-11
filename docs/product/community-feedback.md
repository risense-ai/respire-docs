# Community feedback {#community-feedback}

> This page is compiled automatically from two WeChat groups that discuss this project. Only ideas, feedback, requests and bugs are kept. Speakers appear in order of first appearance as 参与者A/B/C... (each group is numbered independently); WeChat ids, phone numbers, emails, keys, contracts and internal business figures are removed. Raw chat logs are never published or committed.

A rolling, de-identified digest of what users and contributors actually said about Respire in the WeChat groups, collected by a scheduled job every night and grouped by day.

## Daily index {#daily-index}

| Date | [Ideas](#ideas) | Feedback | Requests | Bugs |
| --- | --- | --- | --- | --- |
| [2026-11-11](#day-2026-11-11) | 7 | 12 | 8 | 1 |
| [2026-11-10](#day-2026-11-10) | 4 | 4 | 3 | 1 |
| [2026-11-09](#day-2026-11-09) | 4 | 6 | 4 | 2 |

## Ideas {#ideas}

15 ideas (5 done, 4 in progress). The list grows with genuinely new ideas: one row per topic, never repeated by day; done items are ticked, in-progress items say in progress; statements, reviews, test conclusions and forwarded material are not listed here.

### Not implemented {#ideas-open}

- [~] Pick models and schedule work by task weight —— in progress
- [ ] Compress prompts to save tokens
- [ ] Make chat-history import a separate package used by CLI/GUI
- [~] Cache optimisation to cut recall latency to about one third —— in progress
- [~] Let memtool curate memory on a schedule and when idle —— in progress
- [ ] Match edgeever's polish and interface quality in the CLI
- [~] Bundle the runtime and CLI in the installer with automatic setup —— in progress
- [ ] Support serverless peer-to-peer connections established with a pairing code
- [ ] Split Astra's features out and port them into Big Fat Fish
- [ ] Build up frontend and UI design capability to produce a better-looking interface

### Implemented {#ideas-done}

- [x] Complete the Respire plugin for the Magpie host —— commit a3ae9b3
- [x] Open plugin ecosystem: standard features in the client, experiments in memtool, user-built plugins —— repos.md:27 + plugin-ecosystem.md:5-14
- [x] Keep a persistent idea list as a living document —— memory c044fcdc
- [x] Have an agent watch WeChat groups on a schedule and update the document —— wechat-memory/bin/nightly.sh + respire-wechat-feedback.timer
- [x] Keep a standalone npm release for GUI-less environments —— respire-cli/npm/artifact-manifest.json + respire-cli/npm/scripts/release-publication.mjs

## 2026-11-11 {#day-2026-11-11}

### Feedback {#feedback-2026-11-11}

- **参与者L** · 12:59 · Memory Leap Board — Test feedback: having another model write the plan first and then handing it to the cabinet works; the cabinet ran a full night without problems.
- **参与者A** · 13:00 · Memory Leap Board — The cabinet mode works well.
- **参与者A** · 13:04 · Memory Leap Board — On copying existing solutions: don't copy, go your own way.
- **参与者J** · 13:06 · Memory Leap Board — The group-chat idea is good and worth continuing.
- **参与者L** · 15:48 · Memory Leap Board — Ordinary users can simply run what exists today and act as early testers.
- **参与者L** · 16:46 · Memory Leap Board — Product assessment: even with bge-m3 alone, retrieval should feel good enough now.
- **参与者G** · 16:51 · Memory Leap Board — After wiring starmem in it is not as lively as expected; the user asks whether there is a configuration trick.
- **参与者W** · 16:56 · Memory Leap Board — Tried astrbot but has not connected it to starmem yet; views starmem as the better base layer.
- **参与者G** · 16:57 · Memory Leap Board — Connected deskpet directly to starmem; after a full day of use the responses feel sluggish.
- **参与者L** · 19:28 · Memory Leap Board — Measured CPU use of the new rsrs build is nearly imperceptible.
- **参与者A** · 19:36 · Memory Leap Board — On review the logic looks fine; the problem is more likely version-related.
- **参与者J** · 19:38 · Memory Leap Board — Once this build ships, the everyday performance issues should be gone.

### Requests {#request-2026-11-11}

- **参与者A** · 13:13 · Memory Leap Board — Can each of the six ministries be assigned its own model?
- **参与者A** · 18:19 · Memory Leap Board — Should a memory-equipped agent be built to handle curation?
- **参与者J** · 21:13 · Memory Leap Board — Hopes the Respire CLI can match edgeever in polish and interface quality, with an equally good-looking UI.
- **参与者G** · 21:15 · Memory Leap Board — Suggests adding serverless peer-to-peer connections set up with a pairing code.
- **参与者A** · 21:20 · Memory Leap Board — Asks when the Respire client will ship and says they will help with integration testing after the release.
- **参与者A** · 21:22 · Memory Leap Board — Believes packaging the client as an installer would further lower the barrier to entry.
- **参与者J** · 21:22 · Memory Leap Board — Wants the client to bundle the CLI and install it automatically, so users no longer need to fetch it separately through npm.
- **参与者A** · 21:23 · Memory Leap Board — Wants the CLI to keep being published on npm so it remains usable on servers and other environments without a GUI.

### Bugs {#bug-2026-11-11}

- **参与者J** · 19:35 · Memory Leap Board — A relatively large change brought six major issues, and fixes are still in progress.

## 2026-11-10 {#day-2026-11-10}

### Feedback {#feedback-2026-11-10}

- **参与者A** · 01:11 · Memory Leap Board — The magpie rs plugin feels genuinely interesting to use.
- **参与者J** · 15:05 · Memory Leap Board — None of the open-source personal agents available outside are actually usable.
- **参与者L** · 15:31 · Memory Leap Board — The split between memtool and client is muddled: the client should have a plugin system and memtool should be one of its plugins.
- **参与者L** · 21:34 · Memory Leap Board — Some of the narrower projects compare badly with mem00.

### Requests {#request-2026-11-10}

- **参与者T3** · 00:49 · Respire seed users — A user wired a local model into a game and asks whether this software can extract memory from it.
- **参与者V2** · 13:10 · Respire seed users — Ship the release already, people are waiting impatiently.
- **参与者J** · 14:48 · Memory Leap Board — Can these be cleaned up and turned into our own agent?

### Bugs {#bug-2026-11-10}

- **参与者E3** · 01:11 · Respire seed users — Suspicion that magpie executes rsrs itself at its own layer.

## 2026-11-09 {#day-2026-11-09}

### Feedback {#feedback-2026-11-09}

- **参与者A** · 00:40 · Respire seed users — One evaluation round of the new cabinet mode saves about 50%.
- **参与者L** · 10:48 · Memory Leap Board — The drafted article reads too much like AI output and the title has the same smell; readers want plainer human wording.
- **参与者S2** · 11:08 · Respire seed users — Even with a sandbox policy configured it still fails to connect; the sandbox looks like it blocks network requests.
- **参与者J** · 13:14 · Memory Leap Board — Even the trimmed version still reads like AI prose; more iteration is needed.
- **参与者L** · 13:24 · Memory Leap Board — After the optimisation the run is twice as fast and token use dropped to 50%.
- **参与者Q3** · 18:23 · Respire seed users — With Codex and ChatGPT sharing quota, an unsubscribed new account hits limits on file uploads and context, which makes it nearly unusable.

### Requests {#request-2026-11-09}

- **参与者A** · 13:26 · Memory Leap Board — A release notes document is requested.
- **参与者A** · 14:09 · Memory Leap Board — Ask: should a new version be tagged?
- **参与者V2** · 16:24 · Respire seed users — The client runtime split is still unfinished; people are waiting for the split result.
- **参与者V2** · 16:31 · Respire seed users — Please fix the client first: it cannot even update itself.

### Bugs {#bug-2026-11-09}

- **参与者A** · 08:41 · Memory Leap Board — In the metadata both project and tags come back empty.
- **参与者S2** · 11:11 · Respire seed users — It defaults to the CLI yet is still blocked by the sandbox, so it cannot be used.
