# Ludo Global Path Adapter Mode Source Spec

## Goal

Add game-mode aware path source selection to `LudoGlobalPathAdapter`.

The adapter must keep the existing public path query APIs stable while allowing:

- `CLASSIC` mode to use the full player path cache.
- `QUICK` mode to use the public loop path cache by default.
- `QUICK` mode to switch one chair from public loop path to full player path after that chair reaches OPEN GATE.

## Requirements

- Add a game mode property to `LudoGlobalPathAdapter`.
- Provide public set/get APIs for the game mode.
- Preserve existing public path query APIs:
  - `getPlayerPath`
  - `getPlayerPublicLoopPath`
  - `getMovePath`
  - `getPathIndex`
  - `getStepsToFinish`
  - `isFinished`
  - `isInBase`
  - `getBaseSlotId`
- In `CLASSIC`, `getPlayerPath(chairIndex)` must read from `_cache`.
- In `QUICK`, `getPlayerPath(chairIndex)` must read from `_publicLoopCache` unless the chair has reached OPEN GATE.
- In `QUICK`, once a chair reaches OPEN GATE, only that chair reads from `_cache`.
- OPEN GATE state is one-way during the current game/table lifecycle.
- OPEN GATE state resets only when the game ends or the table changes.

## Non Goals

- Do not change board coordinate generation.
- Do not change `BasicPathGenerator` or `BasicViewTransformer`.
- Do not change the public behavior of `LudoPathViewResolver` directly.
- Do not implement OPEN GATE rule detection inside `LudoGlobalPathAdapter`.
- Do not refactor unrelated game mode systems.

## Current Behavior

`LudoGlobalPathAdapter` currently has two caches:

- `_cache`: chair index to full path, including public track and home path.
- `_publicLoopCache`: chair index to public loop path only, length 52.

Current `getPlayerPath(chairIndex)` always reads `_cache`.

## Proposed API

Import `LudoGameMode` from `../gameDef/GameDef`.

Add:

```ts
private _gameMode: LudoGameMode = LudoGameMode.CLASSIC;
private readonly _quickOpenGateChairSet: Set<number> = new Set();
```

Add public APIs:

```ts
public setGameMode(gameMode: LudoGameMode): void;
public getGameMode(): LudoGameMode;
public markQuickOpenGate(chairIndex: number): void;
public isQuickOpenGate(chairIndex: number): boolean;
public resetQuickOpenGateState(): void;
```

Do not expose an API that sets OPEN GATE back to false for one chair. The rule is one-way during a game/table lifecycle.

## Path Source Rules

`getPlayerPath(chairIndex)` becomes the path source router.

Rules:

- `CLASSIC`: return full path from `_cache`.
- `QUICK` and chair has not opened gate: return public loop path from `_publicLoopCache`.
- `QUICK` and chair has opened gate: return full path from `_cache`.
- `DEFAULT`: fallback to `CLASSIC` behavior.

Internal helper methods may be added to keep the routing readable:

```ts
private getFullPlayerPath(chairIndex: number): number[];
private shouldUseFullPath(chairIndex: number): boolean;
```

## State Flow

Initial state:

```text
gameMode = CLASSIC
quickOpenGateChairSet = empty
```

When QUICK mode starts:

```text
gameMode = QUICK
all chairs -> public loop path
```

When chair 1 reaches OPEN GATE:

```text
chair 0 -> public loop path
chair 1 -> full path
chair 2 -> public loop path
chair 3 -> public loop path
```

When game ends or table changes:

```text
resetQuickOpenGateState()
```

## Lifecycle And Ownership

`LudoGlobalPathAdapter` owns only path source state:

- current game mode
- which QUICK chairs have opened gate
- path caches

The adapter does not own:

- detection of OPEN GATE conditions
- game end detection
- table change detection

External orchestration should call:

- `setGameMode(gameMode)` during game mode setup.
- `markQuickOpenGate(chairIndex)` when the rule system determines the chair reached OPEN GATE.
- `resetQuickOpenGateState()` when the game ends or the table changes.

## Cleanup And Async Risk

No async flow is introduced.

No Cocos lifecycle callbacks, listeners, tweens, schedules, promises, or Spine callbacks are introduced.

Cleanup risk is limited to stale adapter state. This is handled by explicit `resetQuickOpenGateState()`.

## Public API Impact

Existing APIs remain available and keep their signatures.

Behavioral change:

- `getPlayerPath(chairIndex)` becomes mode-aware.
- Existing callers of `getMovePath`, `getPathIndex`, and `getStepsToFinish` are affected indirectly because they use `getPlayerPath`.

This is intended behavior.

## Edge Cases

- If `markQuickOpenGate` is called in `CLASSIC`, the state can still be recorded, but it has no effect until `QUICK` path routing is active.
- If `markQuickOpenGate` is called multiple times for the same chair, it remains idempotent.
- If an invalid chair index is passed, the adapter should avoid mutating OPEN GATE state.
- Existing path builders currently assume valid chair indexes; this spec does not broaden that validation unless needed during implementation.

## Known Risk

`isFinished(chairIndex, gridPos)` currently checks `PLAYER_HOME_END[chairIndex]`.

In QUICK mode before OPEN GATE, a chair uses the public loop path and cannot reach home path indexes through `getPlayerPath`.

This spec does not change `isFinished`. If QUICK mode has a different finish rule before OPEN GATE, that should be handled in a separate rule spec.

## Verification

Manual or TypeScript-level checks should confirm:

- CLASSIC `getPlayerPath(0)` returns the same full path behavior as before.
- QUICK before OPEN GATE returns 52 public loop ids.
- QUICK after `markQuickOpenGate(chair)` returns full path for that chair.
- QUICK after `markQuickOpenGate(chair)` does not change other chairs.
- `resetQuickOpenGateState()` returns QUICK chairs to public loop behavior.
- Existing public method signatures remain unchanged.

## Proposed Implementation Phases

Phase 1:

- Add game mode state and OPEN GATE state APIs.
- Route `getPlayerPath` by game mode and chair OPEN GATE state.
- Keep changes scoped to `LudoGlobalPathAdapter.ts`.

Phase 2:

- Add or run focused TypeScript checks for CLASSIC and QUICK routing behavior.
- Review whether external setup code should call `setGameMode`, `markQuickOpenGate`, and `resetQuickOpenGateState`.

Phase 3:

- Only if required by integration, connect external orchestration points that know game mode, OPEN GATE, game end, or table change events.
