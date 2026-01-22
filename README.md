# Bird

**Isolated web app wrapper for desktop.**

Bird turns any website into a standalone desktop application with complete session isolation, advanced kiosk mode, and enterprise-ready packaging.

## Why Bird?

- **Session Isolation**: Each app runs in its own partition (cookies, localStorage, cache) — no cross-contamination between apps
- **Enterprise Packaging**: Web app vendors can distribute their SaaS as a native desktop app, separate from the browser
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
| **Desktop Shortcuts** | Deploy apps as native shortcuts (.desktop on Linux) |
| **Downloads** | Auto-open by MIME type, configurable directory |
| **Themes** | System, light, or dark mode |
| **i18n** | English and French |

## Quick Start

### Run from source

```bash
# Prerequisites: Node.js >= 20, pnpm >= 9

pnpm install
pnpm dev
```

### Build & Package

```bash
pnpm build                    # Build for production
pnpm package:linux            # Create AppImage
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

### User-Agent Presets

```
desktop:bird          # Default (clean Electron UA)
desktop:chrome        # Chrome on current OS
desktop:firefox       # Firefox on current OS
desktop:safari        # Safari (macOS)
desktop:edge          # Edge (Windows)
mobile:chrome         # Chrome on Android
mobile:safari         # Safari on iPhone
tablet:chrome         # Chrome on tablet
desktop:ie6           # For the brave
```

## Use Cases

### 1. Isolated Web Apps

Run Gmail, Slack, and Notion as separate apps — each with its own cookies and session. No more "you're signed into another account" issues.

### 2. SaaS Distribution

Web application vendors can package Bird with their config to distribute a branded desktop app. Your users get a dedicated experience outside the browser — no competing tabs, no distractions.

### 3. Kiosk & Digital Signage

Lock a terminal to your dashboard or customer portal. Custom escape shortcuts mean only authorized users can exit. Auto-return to home URL on idle.

### 4. Testing & Development

Quickly test how your site behaves with different user-agents. Check mobile layouts, browser-specific features, or legacy IE compatibility without switching browsers.

## Documentation

- [DEVELOPMENT.md](DEVELOPMENT.md) — Setup, commands, debugging
- [ARCHITECTURE.md](ARCHITECTURE.md) — Project structure, patterns, data flow
- [CONTRIBUTING.md](CONTRIBUTING.md) — Code philosophy, conventions
- [FEATURES.md](FEATURES.md) — Full feature list and roadmap

## Tech Stack

- **Electron** — Desktop runtime
- **TypeScript** — Type safety
- **React** — UI components
- **Chakra UI** — Component library
- **Zod** — Schema validation
- **Biome** — Linting & formatting
- **electron-vite** — Build tooling

## License

[GPL-3.0-or-later](LICENSE)
