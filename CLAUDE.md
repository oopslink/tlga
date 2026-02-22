# Project Rules

## Frontend Rules

- All user-facing dialogs (alerts, confirms, prompts) must use the unified modal system (`useModal` composable + `AppModal` component). Never use `window.alert()`, `window.confirm()`, or `window.prompt()`.

## CLAUDE Generated Documents

- CLAUDE 生成的所有 Markdown 文档应统一保存到 `doc` 目录下，以便集中管理和版本控制。
