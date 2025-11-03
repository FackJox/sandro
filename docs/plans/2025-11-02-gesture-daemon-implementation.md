# Configurable Gesture Daemon Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Zig-based daemon that detects configured multitouch gestures and runs mapped actions (e.g., `niri msg action toggle-overview`) on Wayland.

**Architecture:** Single async event loop hands libevdev events to modular gesture recognizers fed by validated JSON config; completed gestures enqueue actions executed by a worker to keep input processing non-blocking.

**Tech Stack:** Zig 0.15.2, libevdev, epoll, inotify, std.ChildProcess, JSON parsing via Zig stdlib.

---

### Task 1: Project Scaffold and Dependencies

**Files:**
- Create: `src/main.zig`, `src/config.zig`, `src/input.zig`, `src/gestures.zig`, `src/actions.zig`, `src/log.zig`, `src/util.zig`
- Modify: `build.zig`
- Test: `src/main.zig` sanity test

**Step 1: Initialize Zig executable template**

Run: `zig init-exe --name yesture`

Expected: creates `build.zig`, `src/main.zig`, `src/root.zig`, `zig.mod`.

**Step 2: Remove unused `src/root.zig` import**

Edit `src/main.zig` to the minimal stub:

```zig
const std = @import("std");

pub fn main() !void {
    try std.io.getStdOut().writer().print("yesture daemon placeholder\n", .{});
}
```

**Step 3: Add library modules and expose them**

Create empty module files by running:

```bash
for f in config input gestures actions log util; do printf "const std = @import(\"std\");\n\n" > src/$f.zig; done
```

Expected: new files with stub content.

**Step 4: Register modules in `build.zig`**

Replace executable sources block with:

```zig
const exe = b.addExecutable(.{
    .name = "yesture",
    .root_source_file = .{ .path = "src/main.zig" },
});
exe.linkLibC();
exe.install();
b.installArtifact(exe);
```

**Step 5: Add sanity test to `src/main.zig`**

```zig
test "daemon main compiles" {
    try main();
}
```

**Step 6: Run baseline tests**

Run: `zig test src/main.zig`

Expected: PASS.

**Step 7: Commit scaffold**

```bash
git add build.zig zig.mod src
git commit -m "chore: scaffold yesture project"
```

---

### Task 2: Configuration Loader with Validation

**Files:**
- Modify: `src/config.zig`, `src/util.zig`
- Test: `src/config.zig`

**Step 1: Write failing config parse test**

Append to `src/config.zig`:

```zig
const std = @import("std");

pub const DeviceMatch = struct {
    name_substring: []const u8,
    rotation_deg: i32,
    scale: f32,
};

pub const GestureDef = struct {
    id: []const u8,
    fingers: u8,
    action: []const u8,
};

pub const Config = struct {
    devices: []DeviceMatch,
    gestures: []GestureDef,
};

test "config: parse minimal valid JSON" {
    const json =
        \\{
        \\  "devices": [{"name_substring": "NVTK", "rotation_deg": 90, "scale": 1.65}],
        \\  "gestures": [{"id": "overview-swipe", "fingers": 4, "action": "toggle-overview"}]
        \\}
    ;
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();
    const cfg = try loadConfigFromSlice(allocator, json);
    defer cfg.deinit(allocator);
    try std.testing.expectEqual(@as(u8, 4), cfg.gestures[0].fingers);
    try std.testing.expectEqualStrings("toggle-overview", cfg.gestures[0].action);
}
```

Leave `loadConfigFromSlice` undefined.

**Step 2: Run test to confirm failure**

Run: `zig test src/config.zig`

Expected: FAIL, undefined symbol.

**Step 3: Implement minimal JSON loader**

Add below test:

```zig
pub fn loadConfigFromSlice(allocator: std.mem.Allocator, json: []const u8) !ConfigHandle {
    var parsed = try std.json.parseFromSlice(std.json.Value, allocator, json, .{ .allocator = allocator });
    errdefer parsed.deinit();
    const root = parsed.value;
    const devices_node = root.object.get("devices") orelse return error.MissingDevices;
    const gestures_node = root.object.get("gestures") orelse return error.MissingGestures;
    var devices = try parseDevices(allocator, devices_node);
    errdefer freeDevices(allocator, devices);
    var gestures = try parseGestures(allocator, gestures_node);
    errdefer freeGestures(allocator, gestures);
    return ConfigHandle{
        .devices = devices,
        .gestures = gestures,
        .parsed = parsed,
    };
}
```

Define `ConfigHandle` with `deinit`, `parseDevices`, `parseGestures`, and error enums.

**Step 4: Run tests again**

Run: `zig test src/config.zig`

Expected: PASS.

**Step 5: Commit config module**

```bash
git add src/config.zig src/util.zig
git commit -m "feat: add JSON config loader with validation"
```

---

### Task 3: Structured Logging Helpers

**Files:**
- Modify: `src/log.zig`, `src/main.zig`
- Test: `src/log.zig`

**Step 1: Write logging formatter test**

Add to `src/log.zig`:

```zig
const std = @import("std");

pub const Level = enum { debug, info, warn, error };

test "log: format message with level" {
    var buf: [256]u8 = undefined;
    var fba = std.heap.FixedBufferAllocator.init(&buf);
    const writer = fba.writer();
    try log(writer, .info, "gesture-ready", .{ .device = "event10" });
    try std.testing.expect(std.mem.indexOf(u8, buf[0..writer.pos], "gesture-ready") != null);
}
```

Leave `log` undefined.

**Step 2: Run test to verify failure**

Run: `zig test src/log.zig`

Expected: FAIL, undefined `log`.

**Step 3: Implement log function**

Add implementation:

```zig
pub fn log(writer: anytype, level: Level, msg: []const u8, context: anytype) !void {
    try writer.print("[{s}] {s}", .{ levelToString(level), msg });
    inline for (std.meta.fields(@TypeOf(context))) |field| {
        const value = @field(context, field.name);
        try writer.print(" {s}={any}", .{ field.name, value });
    }
    try writer.print("\n", .{});
}

fn levelToString(level: Level) []const u8 {
    return switch (level) {
        .debug => "DEBUG",
        .info => "INFO",
        .warn => "WARN",
        .error => "ERROR",
    };
}
```

**Step 4: Run test to confirm pass**

Run: `zig test src/log.zig`

Expected: PASS.

**Step 5: Integrate logger into `main.zig` placeholder**

Import `log.zig` and update `main` to write startup message.

**Step 6: Commit logging**

```bash
git add src/log.zig src/main.zig
git commit -m "feat: add structured logging helper"
```

---

### Task 4: Device Discovery and Calibration

**Files:**
- Modify: `src/input.zig`, `src/util.zig`
- Test: `src/input.zig`

**Step 1: Write failing device scan test (mocked)**

In `src/input.zig`:

```zig
const std = @import("std");
const config = @import("config.zig");

test "input: match multitouch device" {
    var matches = [_]config.DeviceMatch{
        .{ .name_substring = "NVTK0603", .rotation_deg = 90, .scale = 1.65 },
    };
    const device = try selectDeviceForMatch(matches[0], fakeEnumerator);
    try std.testing.expectEqualStrings("event10", device.event_path);
}
```

Define `fakeEnumerator` returning mocked devices.

**Step 2: Run test to ensure failure**

Run: `zig test src/input.zig`

Expected: FAIL, undefined functions.

**Step 3: Implement `selectDeviceForMatch` with libevdev abstraction**

Add:

```zig
pub const DeviceHandle = struct {
    event_path: []const u8,
    name: []const u8,
    rotation_deg: i32,
    scale: f32,
};

pub fn selectDeviceForMatch(match: config.DeviceMatch, enumerator: Enumerator) !DeviceHandle {
    var iter = try enumerator.start();
    defer iter.deinit();
    while (try iter.next()) |dev| {
        if (!std.mem.containsAtLeast(u8, dev.name, 1, match.name_substring)) continue;
        if (!dev.hasMultitouch) continue;
        return DeviceHandle{
            .event_path = dev.event_path,
            .name = dev.name,
            .rotation_deg = match.rotation_deg,
            .scale = match.scale,
        };
    }
    return error.DeviceNotFound;
}
```

Stub `Enumerator` interface and `fakeEnumerator`.

**Step 4: Run test again**

Run: `zig test src/input.zig`

Expected: PASS.

**Step 5: Commit input discovery**

```bash
git add src/input.zig src/util.zig
git commit -m "feat: add device discovery abstraction"
```

---

### Task 5: Gesture State Machine

**Files:**
- Modify: `src/gestures.zig`
- Test: `src/gestures.zig`

**Step 1: Write failing state transition test**

In `src/gestures.zig`:

```zig
const std = @import("std");

test "gestures: four finger swipe completes" {
    var recognizer = GestureRecognizer.init(.{
        .id = "overview-swipe",
        .fingers = 4,
        .min_travel = 250.0,
        .direction = .up,
        .timeout_ms = 400,
    });
    try recognizer.handleTouchDown(.{ .slot = 0, .x = 100, .y = 900 });
    try recognizer.handleTouchDown(.{ .slot = 1, .x = 200, .y = 900 });
    try recognizer.handleTouchDown(.{ .slot = 2, .x = 300, .y = 900 });
    try recognizer.handleTouchDown(.{ .slot = 3, .x = 400, .y = 900 });
    try recognizer.handleMove(.{ .slot = 0, .x = 120, .y = 400 });
    try recognizer.handleMove(.{ .slot = 1, .x = 220, .y = 400 });
    try recognizer.handleMove(.{ .slot = 2, .x = 320, .y = 400 });
    try recognizer.handleMove(.{ .slot = 3, .x = 420, .y = 400 });
    const result = recognizer.evaluate(.{ .elapsed_ms = 200 });
    try std.testing.expect(result == .triggered);
}
```

Leave `GestureRecognizer` undefined.

**Step 2: Run test to confirm failure**

Run: `zig test src/gestures.zig`

Expected: FAIL.

**Step 3: Implement recognizer with states**

Add:

```zig
pub const Direction = enum { up, down, left, right };

pub const GestureRecognizer = struct {
    const State = enum { idle, primed, tracking };
    state: State,
    config: Config,
    active: [10]?TouchPoint,
    start_centroid: ?Vec2,
    last_centroid: ?Vec2,
    elapsed: u32,

    pub fn init(config: Config) GestureRecognizer {
        return GestureRecognizer{
            .state = .idle,
            .config = config,
            .active = [_]?TouchPoint{null} ** 10,
            .start_centroid = null,
            .last_centroid = null,
            .elapsed = 0,
        };
    }

    // implement handleTouchDown, handleMove, handleTouchUp, evaluate
};
```

Fill in handlers to update state machine per design, using centroid calculations.

**Step 4: Re-run tests**

Run: `zig test src/gestures.zig`

Expected: PASS.

**Step 5: Commit gesture logic**

```bash
git add src/gestures.zig
git commit -m "feat: add gesture state machine"
```

---

### Task 6: Action Executor and Rate Limiter

**Files:**
- Modify: `src/actions.zig`, `src/log.zig`
- Test: `src/actions.zig`

**Step 1: Write failing action queue test**

In `src/actions.zig`:

```zig
const std = @import("std");

test "actions: enqueue and execute shell command" {
    var arena = std.heap.ArenaAllocator.init(std.heap.page_allocator);
    defer arena.deinit();
    var exec = try ActionExecutor.init(arena.allocator(), .{ .command = "echo ok" });
    try exec.enqueue("overview-swipe");
    try exec.tick();
    try std.testing.expectEqual(@as(usize, 0), exec.pendingCount());
}
```

Leave `ActionExecutor` undefined.

**Step 2: Run test to ensure failure**

Run: `zig test src/actions.zig`

Expected: FAIL.

**Step 3: Implement executor**

Add:

```zig
const log = @import("log.zig");

pub const ActionExecutor = struct {
    allocator: std.mem.Allocator,
    queue: std.TailQueue(QueuedAction),
    command: []const u8,
    last_trigger_ms: u64,
    cooldown_ms: u64,

    pub fn init(allocator: std.mem.Allocator, cfg: Config) !ActionExecutor { ... }
    pub fn enqueue(self: *ActionExecutor, id: []const u8) !void { ... }
    pub fn tick(self: *ActionExecutor) !void {
        if (self.queue.len == 0) return;
        const now = std.time.milliTimestamp();
        if (now - self.last_trigger_ms < self.cooldown_ms) return;
        var action = self.queue.popFirst() orelse return;
        defer action.deinit(self.allocator);
        var process = std.ChildProcess.init(&[_][]const u8{"sh", "-c", self.command}, self.allocator);
        defer process.deinit();
        try process.spawn();
        _ = try process.wait();
        self.last_trigger_ms = now;
        try log.log(std.io.getStdErr().writer(), .info, "action triggered", .{ .id = id });
    }
};
```

Implement `pendingCount` returning queue length.

**Step 4: Run tests**

Run: `zig test src/actions.zig`

Expected: PASS.

**Step 5: Commit actions module**

```bash
git add src/actions.zig src/log.zig
git commit -m "feat: add action executor with cooldown"
```

---

### Task 7: Daemon Event Loop Integration

**Files:**
- Modify: `src/main.zig`, `src/input.zig`, `src/gestures.zig`, `src/actions.zig`
- Test: `src/main.zig`

**Step 1: Write failing integration test**

Extend `src/main.zig` with:

```zig
test "main: wired gesture triggers action" {
    try runDaemonOnce(.{
        .config_json = testConfig(),
        .events = makeSwipeEvents(),
    });
}
```

Stub helper functions to compile but return `error.TODO`.

**Step 2: Run test to ensure failure**

Run: `zig test src/main.zig`

Expected: FAIL with TODO.

**Step 3: Implement run loop skeleton**

Implement `runDaemonOnce` to:
1. Parse config via `config.loadConfigFromSlice`.
2. Initialize device enumerator stub.
3. Create recognizer set.
4. Feed synthetic events and assert action queue drained.

**Step 4: Run integration test**

Run: `zig test src/main.zig`

Expected: PASS.

**Step 5: Commit integration**

```bash
git add src/main.zig src/input.zig src/gestures.zig src/actions.zig
git commit -m "feat: integrate modules into daemon loop"
```

---

### Task 8: Binary Build and Manual Test Hook

**Files:**
- Modify: `src/main.zig`, `README.md`

**Step 1: Add CLI args to `main`**

Support `--config` path override and `--dry-run`.

**Step 2: Build executable**

Run: `zig build -Doptimize=ReleaseSafe`

Expected: success, binary at `zig-out/bin/yesture`.

**Step 3: Document run instructions**

Create `README.md` snippet:

```markdown
```bash
sudo ./zig-out/bin/yesture --config config.json
```
```

**Step 4: Commit release prep**

```bash
git add src/main.zig README.md
git commit -m "chore: prepare binary run path"
```

---

### Task 9: Final Verification and Cleanup

**Files:**
- Modify: none

**Step 1: Run full test suite**

Run: `zig build test`

Expected: PASS.

**Step 2: Format code**

Run: `zig fmt src/*.zig`

Expected: no diffs after formatting.

**Step 3: Commit formatting if necessary**

```bash
git status --short
git add src
git commit -m "chore: fmt"  # only if files changed
```

**Step 4: Summarize for review**

Prepare changelog entry or PR description summarizing features and testing.
