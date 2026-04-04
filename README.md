# Temus

> Sit. Think. Then build.

Blueprint your ideas before you open any AI tool. The thinking layer between inspiration and execution.

## Download

| Platform | Command |
|----------|---------|
| macOS    | `npm run electron:build:mac` |
| Windows  | `npm run electron:build:win` |
| Linux    | `npm run electron:build:linux` |
| All      | `npm run electron:build:all` |

Prebuilt binaries are attached to each [GitHub Release](../../releases) automatically.

## Features

- 6-section blueprint canvas — Spark, Problem, Vision, Questions, Resources, First Move
- Tag-based AI prompts — Business plan, Product research, Learning roadmap, Side project launch plan
- Lock mechanic — commit your thinking before you build
- Copy to AI — structured prompt ready to paste into Claude or ChatGPT
- Command palette — Cmd+K
- Persistent storage — data saved locally, survives restarts
- Delete blueprints — hover to reveal delete
- Fully offline — no backend, no account, no cloud

## Run locally

    git clone https://github.com/nachiketp/temus
    cd temus
    npm install
    npm run electron:dev

## Build

    # macOS
    npm run electron:build:mac

    # Windows
    npm run electron:build:win

    # Linux
    npm run electron:build:linux

    # All platforms
    npm run electron:build:all

## Release a new version

    git tag v1.0.1
    git push origin v1.0.1

GitHub Actions auto-builds Mac, Windows and Linux and attaches them to the release.

## Stack

React · Vite · Electron · localStorage

## Philosophy

In a world where AI pushes everyone into instant action mode — Temus is the pause.
The blueprint before the build. The thinking before the prompting.

## License

MIT — Copyright (c) 2026 Nachiket Patel
