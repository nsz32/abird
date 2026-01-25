<img src="icon.svg" align="right" width="96" />

# Bird

**Desktop, redistribuable, isolated browser.**

Bird turns any website into a standalone desktop application with complete session isolation, advanced kiosk mode, and (WIP) enterprise-ready packaging.

## Why Bird?

- **Session Isolation**: Each app runs in its own partition (cookies, localStorage, cache) — no cross-contamination between apps
- **Ship Your SaaS as a Desktop App** *(coming soon)*: SaaS vendors will be able to package Bird with a locked config to distribute their web app as a native desktop experience — out of the browser, branded, and ready to install
- **Kiosk Mode**: Lock users to specific URLs with custom escape shortcuts — perfect for public terminals, dashboards, or controlled environments
- **User-Agent Spoofing**: Test how sites behave with different browsers/devices, or bypass Electron detection

## Features

| Feature | Description |
|---------|-------------|
| **Partition Isolation** | Each app has its own session (cookies, storage, cache) |
| **URL Routing** | Control which links open internally, externally, or get blocked |
| **Navigation Bar** | Configurable (position, buttons, auto-hide, URL editing) |
| **Ad Blocking** | Built-in ad blocker powered by Ghostery |
| **User-Agent Presets** | Chrome, Firefox, Safari, Edge, mobile devices, even IE6 |
| **Kiosk Mode** | Fullscreen lock with custom exit shortcut |
| **Desktop Shortcuts** | Deploy apps as native shortcuts (.desktop on Linux, Start Menu on Windows) |
| **Downloads** | Auto-open by MIME type, configurable directory, dangerous file detection |
| **Themes** | System, light, or dark mode |
| **i18n** | 10 languages (EN, FR, DE, ES, PT, IT, RU, ZH, AR, HI) |
| **Find in Page** | Built-in find with match highlighting |
| **Tab Management** | Multi-tab support with smart validation |

## Use Cases

### 1. Isolated Web Apps

Run Gmail, Slack, and Notion as separate apps — each with its own cookies and session. No more "you're signed into another account" issues.

### 2. SaaS Distribution *(coming soon)*

Ship your web application as a real desktop app. Package Bird with a preconfigured `config.json` pointing to your SaaS — your customers get a native installer, a dedicated window, and a focused experience outside the browser.

**For SaaS vendors:**
- Your app lives outside the browser — no tabs, no distractions, no "which tab was it?"
- Users launch your app from their dock/taskbar like any native software
- Session isolation means your app never conflicts with their personal accounts
- Custom branding through icons and window titles

**For enterprises:**
- Deploy internal tools as standalone apps (CRM, dashboards, ticketing)
- Control the experience: disable URL bar, lock navigation, enforce routing rules
- Distribute via standard enterprise deployment (deb, AppImage, NSIS installer)

> **Status**: Single-app distribution mode is in development. Currently, you can already use `--app <name>` to launch a specific app directly.

### 3. Kiosk & Digital Signage

Lock a terminal to your dashboard or customer portal. Custom escape shortcuts mean only authorized users can exit. Auto-return to home URL on idle.

### 4. Testing & Development

Quickly test how your site behaves with different user-agents. Check mobile layouts, browser-specific features, or legacy IE compatibility without switching browsers.

## Quick Start

### Run from source

```bash
# Prerequisites: Node.js >= 20, pnpm

pnpm install
pnpm dev
```

### Build & Package

```bash
pnpm build                    # Build for production
pnpm package:appimage         # Create AppImage (Linux)
pnpm package:win              # Create installer (Windows)
```

## Usage

```bash
# Open configuration UI
bird

# Launch a specific app
bird --app gmail

# Browser mode (quick access to any URL)
bird https://example.com

# Kiosk mode with exit shortcut
bird --app dashboard --kiosk Ctrl+Alt+K

# Test with different user-agent
bird --app myapp --userAgent mobile:chrome

# Complete uninstall (remove shortcuts, data, config)
bird --cleanall
```

## Configuration

Bird uses a JSON configuration file (`~/.config/bird/config.json` or via `--config`).

```json
{
  "theme": "system",
  "navBar": {
    "position": "bottom",
    "autoHide": true
  },
  "apps": {
    "gmail": {
      "partition": "gmail",
      "startUrl": "https://mail.google.com",
      "routing": {
        "rules": {
          "^https://[^/]*\\.google\\.com": "internal"
        }
      }
    },
    "slack": {
      "partition": "slack",
      "startUrl": "https://app.slack.com",
      "userAgent": "desktop:chrome"
    }
  }
}
```

## Documentation

- [DEVELOPMENT.md](DEVELOPMENT.md) — Setup, commands, debugging
- [ARCHITECTURE.md](ARCHITECTURE.md) — Project structure, patterns, data flow
- [CONTRIBUTING.md](CONTRIBUTING.md) — Code philosophy, conventions

## Tech Stack

- **Electron 39** — Desktop runtime
- **TypeScript 5.9** — Type safety
- **React 19** — UI components
- **Chakra UI** — Component library
- **Zod** — Schema validation (types = validation)
- **Biome** — Linting & formatting
- **electron-vite** — Build tooling
- **Ghostery** — Ad blocking

## License

[MIT](LICENSE)
