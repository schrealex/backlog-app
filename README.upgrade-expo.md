# Expo SDK Upgrade Plan (47 -> latest)

This project currently runs Expo SDK 47. Jumping directly to the latest SDK is high risk, so this plan upgrades in controlled stages with verification at each step.

## Why staged upgrades

- Limits breakages and makes issues easier to isolate.
- Lets Expo tooling pick compatible package versions per SDK.
- Keeps app shippable between stages.

## Pre-flight (one-time)

```zsh
cd /Users/cbruitzman/projects/React/backlog-app
nvm use 18
npm install
npx expo install --check
npx tsc --noEmit
npm test -- --watchAll=false
```

## Stage 0: safety branch + baseline snapshot

```zsh
cd /Users/cbruitzman/projects/React/backlog-app
git checkout -b chore/expo-upgrade-plan
npx expo config --type public
```

- Capture screenshots for key screens: Backlog, Full List, Finished, Retro, Random.
- Record baseline startup time in emulator.

## Stage 1: SDK 47 -> SDK 50

```zsh
cd /Users/cbruitzman/projects/React/backlog-app
npx expo upgrade 50
npx expo install --fix
npm install
npx expo-doctor
npx tsc --noEmit
npm test -- --watchAll=false
```

- Resolve TypeScript or React Navigation errors first.
- Run emulator smoke test before moving to next stage.

## Stage 2: SDK 50 -> SDK 52

```zsh
cd /Users/cbruitzman/projects/React/backlog-app
npx expo upgrade 52
npx expo install --fix
npm install
npx expo-doctor
npx tsc --noEmit
npm test -- --watchAll=false
```

- Re-check Firestore + AsyncStorage behavior on cold app launch.
- Re-check loading performance and pull-to-refresh.

## Stage 3: SDK 52 -> SDK 54

```zsh
cd /Users/cbruitzman/projects/React/backlog-app
npx expo upgrade 54
npx expo install --fix
npm install
npx expo-doctor
npx tsc --noEmit
npm test -- --watchAll=false
```

- Re-validate web startup (`npm run web`) because old projects can hit bundler/config changes.

## Stage 4: SDK 54 -> latest available SDK

```zsh
cd /Users/cbruitzman/projects/React/backlog-app
npx expo upgrade
npx expo install --fix
npm install
npx expo-doctor
npx tsc --noEmit
npm test -- --watchAll=false
```

- Let `expo upgrade` choose the latest supported SDK at execution time.
- If any package is pinned and conflicts, prefer Expo-managed versions first.

## Expected package updates during the process

These are typical for SDK upgrades, but exact versions should be set by Expo commands:

- `expo`, `react-native`, `react`, `react-dom`
- `@expo/vector-icons`, `expo-status-bar`, `expo-splash-screen`, `expo-font`, `expo-constants`, `expo-linking`, `expo-web-browser`
- `jest-expo`
- `react-native-gesture-handler`, `react-native-screens`, `react-native-safe-area-context`, `react-native-web`

## Project-specific notes

- `@expo/webpack-config` is legacy in older Expo setups. Keep it only if your web workflow still needs it after upgrade checks.
- Re-run Backlog startup timing checks after each stage; your caching improvements should still help.
- Keep Node in the engine range already set in `package.json` unless Expo tooling says otherwise.

## Rollback strategy

If a stage fails badly:

```zsh
cd /Users/cbruitzman/projects/React/backlog-app
git reset --hard HEAD
git clean -fd
npm install
```

Then retry that same stage with smaller, single-issue fixes.

