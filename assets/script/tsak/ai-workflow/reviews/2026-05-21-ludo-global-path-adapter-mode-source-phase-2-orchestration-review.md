# Ludo Global Path Adapter Mode Source Phase 2 Orchestration Review

## Current Workflow Mode

STANDARD

## Current Phase

Phase 2 external orchestration review.

## Execution Status

Review-only phase completed. No production code was changed in this phase.

## Search Evidence

Adapter and resolver search:

```powershell
rg "new LudoGlobalPathAdapter|LudoGlobalPathAdapter|LudoPathViewResolver" -n "D:\cocosTest\ludo\LUDO\assets\script"
```

Result summary:

- `LudoGlobalPathAdapter` exists at `assets/script/pathAdapter/LudoGlobalPathAdapter.ts`.
- `LudoPathViewResolver` imports `LudoGlobalPathAdapter`.
- No production construction site was found for `new LudoGlobalPathAdapter`.
- No production construction site was found for `new LudoPathViewResolver`.
- Current hits outside those files are workflow docs created for this task.

Game mode and room lifecycle search:

```powershell
rg "OPEN GATE|OpenGate|openGate|gate|Gate|setGameMode\(|getCurrentGameMode|initGameMode|reset.*Game|table|Table|room|Room" -n "D:\cocosTest\ludo\LUDO\assets\script"
```

Result summary:

- No existing OPEN GATE detection flow was found by text search.
- `GameFactoryManager.initGameMode(gameMode)` owns game mode initialization.
- `LudoGameManager.initGame(gameMode)` is the public facade that calls `GameFactoryManager.initGameMode(gameMode)`.
- `LudoGameManager.setupRoom(...)` and `setupRoomWithColorIndex(...)` are table/room setup entry points.
- `RoomPlayerManager.clear()` exists and is called when room managers are replaced.

## Ownership Review

### Which object owns game mode setup?

Primary owner:

- `GameFactoryManager`

Evidence:

- `GameFactoryManager` stores `_currentGameMode`.
- `GameFactoryManager.initGameMode(gameMode)` creates game mode components.
- `GameFactoryManager.getCurrentGameMode()` exposes the current mode.

Facade owner:

- `LudoGameManager`

Evidence:

- `LudoGameManager.initGame(gameMode)` delegates to `_factoryManager.initGameMode(gameMode)`.
- `LudoGameManager.getCurrentGameMode()` delegates to `_factoryManager.getCurrentGameMode()`.

Recommendation:

Game mode should be set on `LudoGlobalPathAdapter` during the same orchestration that creates or owns the adapter. Since no adapter owner exists yet, do not add a call blindly.

### Which object detects OPEN GATE?

No existing OPEN GATE detection owner was found by text search.

Recommendation:

Do not place OPEN GATE rule detection inside `LudoGlobalPathAdapter`.

The eventual detector should be a rule/gameplay owner that already knows:

- chair index
- current mode
- rule condition for opening gate
- timing of the turn state mutation

That owner should call:

```ts
markQuickOpenGate(chairIndex)
```

after the rule condition is confirmed.

### Which object detects game end or table change?

Likely table/room lifecycle facade:

- `LudoGameManager`

Evidence:

- `setupRoom(playerCount)` recreates room manager state.
- `initializeRoomManager(playerCount)` clears existing `RoomPlayerManager`.
- `setupRoomWithColorIndex(playerCount, colorCombinationIndex)` also changes room setup flow.

Likely game mode lifecycle owner:

- `GameFactoryManager`

Evidence:

- `initGameMode(gameMode)` destroys current factory components, map decorator, and game map center before creating new components.

Recommendation:

When an adapter owner exists, reset should happen during:

- game mode reinitialization
- room/table setup replacement
- explicit game end cleanup

The call should be:

```ts
resetQuickOpenGateState()
```

## Adapter Ownership Gap

Current production code does not show who owns:

- `LudoGlobalPathAdapter`
- `LudoPathViewResolver`

Current path-facing APIs in `LudoGameManager` still call:

- `getPathGenerator()?.getPlayerPath(...)`
- `getViewTransformer()?.getPathCoordInViewByStartIndex(...)`
- `getViewTransformer()?.getPathSegmentInViewByStartIndex(...)`
- `getViewTransformer()?.getPathCoordInViewByPos(...)`
- `getViewTransformer()?.getPathSegmentInViewByPos(...)`

This means the new adapter API exists, but no production flow currently wires it into game mode or path view queries.

## Integration Recommendation

Do not connect calls directly in this phase.

Recommended next spec/phase:

1. Decide adapter ownership.
2. Decide whether `LudoPathViewResolver` becomes the facade for server global grid id path queries.
3. Add a single owner for adapter lifecycle.
4. During adapter creation, call:

```ts
setGameMode(currentGameMode)
```

5. In the rule owner that detects OPEN GATE, call:

```ts
markQuickOpenGate(chairIndex)
```

6. On game end, game mode reinit, or table/room replacement, call:

```ts
resetQuickOpenGateState()
```

## Files Changed In This Phase

Workflow artifact only:

- `assets/script/tsak/ai-workflow/reviews/2026-05-21-ludo-global-path-adapter-mode-source-phase-2-orchestration-review.md`

No production file was modified during Phase 2.

## Verification Evidence

No TypeScript compile was required for this review-only phase.

Phase 1 focused compile remains the latest code verification evidence:

```powershell
npx --no-install tsc --noEmit --skipLibCheck --target es6 --lib dom,dom.iterable,esnext --module commonjs "D:\cocosTest\ludo\LUDO\assets\script\pathAdapter\LudoGlobalPathAdapter.ts"
```

Result:

```text
Exit code 0
```

## Remaining Risk

- Adapter state is not yet connected to game mode lifecycle.
- OPEN GATE detection owner is not identified in current code.
- `LudoPathViewResolver` is not constructed in production code.
- QUICK `isFinished` behavior remains a separate rule question.

## Blocking Issue

Cannot safely wire `setGameMode`, `markQuickOpenGate`, or `resetQuickOpenGateState` until adapter ownership and OPEN GATE rule ownership are defined.

## Next Available Actions

- Create a new spec for adapter/resolver ownership and integration.
- Pause and let the user decide where `LudoGlobalPathAdapter` should be owned.
- Add minimal construction API only after ownership is approved.

## Recommended Next Step

Create a follow-up STANDARD spec for `LudoGlobalPathAdapter` / `LudoPathViewResolver` ownership and integration before changing production orchestration code.
