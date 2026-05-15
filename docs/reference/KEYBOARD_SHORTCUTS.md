# Keyboard Shortcuts

> Frontend keyboard shortcuts for power users.
> Available in both `twilio-platform` (main app) and `twilio-omni-agent` (chat) unless noted.

---

## Global (every page)

| Shortcut | Action |
|---|---|
| `?` | Open shortcut help overlay |
| `Cmd/Ctrl + K` | Open command palette / quick search |
| `Cmd/Ctrl + /` | Toggle sidebar |
| `Cmd/Ctrl + Shift + D` | Toggle dark/light theme |
| `g` then `h` | Go to **H**ome / Dashboard |
| `g` then `c` | Go to **C**onversations |
| `g` then `n` | Go to **N**iches |
| `g` then `a` | Go to **A**dmin (master admins only) |
| `g` then `s` | Go to **S**ettings |
| `Esc` | Close modal / dismiss toast |
| `Cmd/Ctrl + .` | Open user menu |
| `Cmd/Ctrl + Enter` | Submit any focused form |

## Navigation

| Shortcut | Action |
|---|---|
| `j` / `k` | Move down / up in any list |
| `h` / `l` | Previous / next page (where pagination exists) |
| `Enter` | Open selected row |
| `Shift + Enter` | Open selected row in new tab |
| `x` | Toggle row checkbox (bulk actions) |
| `a` | Select all visible |
| `Shift + a` | Clear selection |

## Conversations / Messaging

| Shortcut | Action |
|---|---|
| `r` | Reply in current thread |
| `Shift + r` | Reply with template picker |
| `e` | Archive conversation |
| `Shift + e` | Mark unread |
| `Cmd/Ctrl + Enter` | Send message |
| `Cmd/Ctrl + Shift + Enter` | Send + schedule next follow-up |
| `Cmd/Ctrl + ↑/↓` | Navigate between threads |

## Composer

| Shortcut | Action |
|---|---|
| `Cmd/Ctrl + B` | Bold (markdown supported in compose) |
| `Cmd/Ctrl + I` | Italic |
| `@` | Insert merge tag (e.g. `{{name}}`) |
| `:` | Emoji picker |
| `Cmd/Ctrl + Shift + V` | Paste as plain text |

## Contacts / Tables

| Shortcut | Action |
|---|---|
| `n` | New contact |
| `/` | Focus search box |
| `Cmd/Ctrl + F` | Same as `/` |
| `Cmd/Ctrl + Shift + F` | Advanced filter panel |
| `Cmd/Ctrl + E` | Export current view to CSV |
| `Cmd/Ctrl + I` | Import CSV |

## Campaigns

| Shortcut | Action |
|---|---|
| `n` | New campaign |
| `Space` | Pause/resume selected campaign |
| `Cmd/Ctrl + Shift + S` | Save draft |
| `Cmd/Ctrl + Shift + L` | Launch campaign (with confirmation) |

## AGI Framework (Pipeline Builder)

| Shortcut | Action |
|---|---|
| `n` | Add node (opens picker) |
| `Delete` / `Backspace` | Remove selected node/edge |
| `Cmd/Ctrl + D` | Duplicate selected node |
| `Cmd/Ctrl + Z` / `Cmd/Ctrl + Shift + Z` | Undo / Redo |
| `Cmd/Ctrl + S` | Save pipeline |
| `Cmd/Ctrl + Enter` | Test-run pipeline |
| `Cmd/Ctrl + 0` | Fit canvas to view |
| `+` / `-` | Zoom in / out |
| `Space + drag` | Pan canvas |

## Omni-Agent (Chat)

| Shortcut | Action |
|---|---|
| `Cmd/Ctrl + Enter` | Send message |
| `Cmd/Ctrl + N` | New chat |
| `Cmd/Ctrl + Shift + N` | New chat with model picker |
| `Cmd/Ctrl + L` | Clear current chat |
| `Cmd/Ctrl + ↑` | Edit last user message |
| `↑` (empty input) | Recall last message |
| `Cmd/Ctrl + M` | Change model |
| `Cmd/Ctrl + Shift + C` | Copy last response |
| `Cmd/Ctrl + R` | Regenerate last response |

## Admin Panel (master admins)

| Shortcut | Action |
|---|---|
| `g` then `t` | Tenants tab |
| `g` then `m` | Metrics tab |
| `g` then `y` | System tab |
| `Cmd/Ctrl + Shift + I` | Impersonate selected tenant |
| `Cmd/Ctrl + Shift + R` | Refresh metrics |

## Modal / Confirmation

| Shortcut | Action |
|---|---|
| `Enter` | Confirm primary action |
| `Esc` | Cancel |
| `Tab` / `Shift + Tab` | Cycle focus |

---

## Customization

Power users can remap shortcuts in **Settings → Keyboard**. Mappings are stored per-tenant in localStorage and synced to the server when signed in.

## Accessibility

All shortcuts respect `prefers-reduced-motion` and announce actions via `aria-live` regions where appropriate. Screen reader users can disable shortcuts entirely in **Settings → Accessibility**.

---

**See also:**
- [`../manuals/FRONTEND_MANUAL.md`](../manuals/FRONTEND_MANUAL.md#keyboard-shortcuts) — implementation details
- [`ROUTES_MAP.md`](ROUTES_MAP.md) — what each `g + letter` shortcut navigates to
