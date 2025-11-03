# Stasis Config Bootstrap

## Context
- `stasis` looks for a Rune config at `~/.config/stasis/stasis.rune`, falling back to `/etc/stasis/stasis.rune`.
- When neither path exists it returns `Could not find stasis configuration file` from `src/config/mod.rs:20`.
- The CLI will also refuse to start if another instance owns the control socket, and it expects a Wayland desktop, but those are independent follow-up issues.

## Goals
- Restore the default config lookup so the CLI no longer fails immediately.
- Produce a portable config that works in development environments lacking `swaylock`, `brightnessctl`, etc.
- Keep the setup user-scoped so it can be committed or adjusted without root.

## Constraints & Observations
- The parser requires at least one idle action block; otherwise it errors with `no valid idle actions found in config`.
- Commands referenced in the action blocks should exist on the target machine; using `echo` via `sh -c` is the lowest-common-denominator.
- The daemon still needs Wayland services to actually run, but config validation happens before that.

## Options Considered
1. Place a config at `~/.config/stasis/stasis.rune` (user-level, no root needed, matches upstream docs).
2. Install `/etc/stasis/stasis.rune` system-wide (requires root, harder to iterate, but works for all users).
3. Supply `stasis --config <path>` each run (good for experiments, but easy to forget in day-to-day usage).

## Decision
- Adopt option 1: create `~/.config/stasis/stasis.rune` with a single `lock_screen` action that shells out to `echo`. This keeps the daemon happy without depending on compositor-specific utilities. Extra actions can be appended later.

## Implementation Notes
- Create the directory with `mkdir -p ~/.config/stasis`.
- Write a config like:
  ```rune
  stasis:
    lock_screen:
      timeout 300
      command "sh -c 'echo Stasis lock placeholder'"
    end
  end
  ```
- After writing the file, `stasis --config ~/.config/stasis/stasis.rune list-actions` should enumerate the `lock_screen` block (Wayland/socket issues aside). Remove stale `/run/.../stasis.sock` files if the control-socket warning persists.
