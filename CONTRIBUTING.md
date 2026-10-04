# Contributing

Keep documentation in English, with concise diagrams, tables and runnable examples. Describe product behavior and developer interfaces; keep migration logs, internal planning and task status outside the documentation.

| Area | Requirement |
| --- | --- |
| Accuracy | Check examples against the implementation |
| Contracts | Update canonical contracts and consumer copies together |
| Rust | Use `Result` and `?`; avoid `.unwrap()` and `.expect()` |
| Security | Keep credentials, user databases and recovery keys out of Git |
| Attribution | Preserve licenses and third-party notices |

```sh
node contracts/validate.mjs
npm run build
```

Explain the behavior changed, why it changed, and the checks run. Documentation edits must not change wire fields or ABI values.
