# Project Rules

## Frontend Rules

- All user-facing dialogs (alerts, confirms, prompts) must use the unified modal system (`useModal` composable + `AppModal` component). Never use `window.alert()`, `window.confirm()`, or `window.prompt()`.
