# Ludo Global Path Adapter Mode Source Phase 1 Checkpoint

## Current Workflow Mode

STANDARD

## Current Phase

Phase 1 implementation checkpoint.

## Execution Status

Phase 1 implementation was applied to `LudoGlobalPathAdapter.ts`.

## Completed Tasks

- Added `LudoGameMode` import.
- Added adapter game mode state.
- Added chair-level QUICK OPEN GATE state.
- Added public game mode APIs:
  - `setGameMode`
  - `getGameMode`
- Added public QUICK OPEN GATE APIs:
  - `markQuickOpenGate`
  - `isQuickOpenGate`
  - `resetQuickOpenGateState`
- Added helper methods:
  - `shouldUseFullPath`
  - `getFullPlayerPath`
  - `isValidChairIndex`
- Updated `getPlayerPath(chairIndex)` routing:
  - CLASSIC and DEFAULT use `_cache`.
  - QUICK unopened chairs use `_publicLoopCache`.
  - QUICK OPEN GATE chairs use `_cache`.

## Review Status

Implementation follows the approved spec and plan.

No `BasicPathGenerator`, `BasicViewTransformer`, or `LudoPathViewResolver` changes were made.

OPEN GATE detection was not added to the adapter.

## Verification Evidence

Plan scoped command with `--noResolve`:

```powershell
npx --no-install tsc --noEmit --skipLibCheck --target es6 --lib dom,dom.iterable,esnext --module commonjs --noResolve "D:\cocosTest\ludo\LUDO\assets\script\pathAdapter\LudoGlobalPathAdapter.ts"
```

Result:

```text
TS2307: Cannot find module '../gameDef/GameDef'
```

Reason:

`--noResolve` blocks resolving the newly added `LudoGameMode` import, so this command is no longer suitable for this file after the approved import was added.

Focused single-file TypeScript compile without `--noResolve`:

```powershell
npx --no-install tsc --noEmit --skipLibCheck --target es6 --lib dom,dom.iterable,esnext --module commonjs "D:\cocosTest\ludo\LUDO\assets\script\pathAdapter\LudoGlobalPathAdapter.ts"
```

Result:

```text
Exit code 0
```

Project compile:

```powershell
npx --no-install tsc --noEmit -p "D:\cocosTest\ludo\LUDO\tsconfig.json"
```

Result:

The project compile still fails in existing Cocos Creator engine declarations under:

```text
C:/ProgramData/cocos/editors/Creator/3.8.7/resources/resources/3d/engine/...
```

No reported project compile error points to `assets/script/pathAdapter/LudoGlobalPathAdapter.ts`.

## Remaining Risk

- External orchestration is not connected yet.
- No caller currently shown in this phase calls `setGameMode`, `markQuickOpenGate`, or `resetQuickOpenGateState`.
- `isFinished(chairIndex, gridPos)` still uses `PLAYER_HOME_END[chairIndex]`; QUICK pre-OPEN-GATE finish behavior remains a separate rule question.

## Blocking Issue

No Phase 1 code blocker.

Project-wide TypeScript verification is blocked by existing Cocos Creator declaration errors unrelated to this file.

## Workspace Change Status

Observed with:

```powershell
git -c safe.directory=D:/cocosTest/ludo/LUDO status --short
```

Relevant production file:

```text
M assets/script/pathAdapter/LudoGlobalPathAdapter.ts
```

Workflow artifact directories are also present:

```text
?? assets/script/tsak.meta
?? assets/script/tsak/
?? run-workflow/
```

## Next Available Actions

- Continue to Phase 2 external orchestration review.
- Pause after Phase 1 and let the user manually review the adapter API.
- Create a follow-up spec for QUICK `isFinished` behavior if needed.

## Recommended Next Step

Continue to Phase 2 external orchestration review before wiring calls into game setup, OPEN GATE detection, game end, or table change flows.
