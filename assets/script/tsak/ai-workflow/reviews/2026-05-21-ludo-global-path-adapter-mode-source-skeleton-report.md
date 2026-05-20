# Skeleton Summary

Created the Phase 1 skeleton for game-mode aware path source routing in `LudoGlobalPathAdapter`.

This skeleton adds the public API and internal structure approved in the plan, but intentionally keeps the active path behavior equivalent to the previous CLASSIC/full-path behavior until full Phase 1 implementation is approved.

# Modified Files

- `assets/script/pathAdapter/LudoGlobalPathAdapter.ts`

# Class Structure

`LudoGlobalPathAdapter` now has additional state fields:

```ts
private _gameMode: LudoGameMode = LudoGameMode.CLASSIC;
private readonly _quickOpenGateChairSet: Set<number> = new Set();
```

The `Set<number>` follows the project rule that Set variables must not contain Map values.

# Function Skeleton

Added public API:

```ts
public setGameMode(gameMode: LudoGameMode): void
public getGameMode(): LudoGameMode
public markQuickOpenGate(chairIndex: number): void
public isQuickOpenGate(chairIndex: number): boolean
public resetQuickOpenGateState(): void
```

Added private helper structure:

```ts
private shouldUseFullPath(chairIndex: number): boolean
private getFullPlayerPath(chairIndex: number): number[]
private isValidChairIndex(chairIndex: number): boolean
```

`getPlayerPath(chairIndex)` now routes through helper methods, but the QUICK public-loop branch is still marked with a Phase 1 TODO and currently falls back to full path.

# Async Flow

No async flow was added.

No promise, callback, schedule, tween, Spine callback, or cancellation path was introduced.

# State Flow

Skeleton state flow:

```text
new adapter -> _gameMode = CLASSIC
setGameMode(mode) -> stores selected mode
markQuickOpenGate(chair) -> records chair in _quickOpenGateChairSet when chair index is valid
resetQuickOpenGateState() -> clears all OPEN GATE chair state
```

The full implementation step will fill:

```text
QUICK + unopened chair -> _publicLoopCache
QUICK + OPEN GATE chair -> _cache
CLASSIC -> _cache
DEFAULT -> _cache
```

# Lifecycle Flow

No Cocos lifecycle methods were added or changed.

External orchestration remains responsible for calling:

- `setGameMode(gameMode)` during mode setup.
- `markQuickOpenGate(chairIndex)` when a chair reaches OPEN GATE.
- `resetQuickOpenGateState()` on game end or table change.

# Orchestration Flow

The adapter owns only path source state and caches.

The adapter does not detect:

- OPEN GATE conditions
- game end
- table change

# TODO Structure

Two TODO comments were added in `getPlayerPath` and `shouldUseFullPath`.

They mark the exact points where Phase 1 implementation will fill QUICK routing behavior:

```ts
// TODO: Phase 1 implementation fills QUICK public loop routing here.
// TODO: Phase 1 implementation routes QUICK chairs by OPEN GATE state.
```

# Boundary Compliance

Compliant with the approved boundary:

- Only `assets/script/pathAdapter/LudoGlobalPathAdapter.ts` was modified.
- No `BasicPathGenerator` changes.
- No `BasicViewTransformer` changes.
- No `LudoPathViewResolver` changes.
- No OPEN GATE detection logic added.
- Existing public method signatures remain.
- No Cocos lifecycle, listener, tween, schedule, promise, callback, Spine, or pool behavior added.

# Verification Evidence

Attempted scoped compile:

```powershell
npx --no-install tsc --noEmit --skipLibCheck --target es6 --lib dom,dom.iterable,esnext --module commonjs --noResolve "D:\cocosTest\ludo\LUDO\assets\script\pathAdapter\LudoGlobalPathAdapter.ts"
```

Result:

```text
TS2307: Cannot find module '../gameDef/GameDef'
```

Reason:

`--noResolve` is not compatible with verifying the new import in isolation.

Attempted project compile:

```powershell
npx --no-install tsc --noEmit -p "D:\cocosTest\ludo\LUDO\tsconfig.json"
```

Result:

Project compile reaches existing Cocos Creator declaration errors under:

```text
C:/ProgramData/cocos/editors/Creator/3.8.7/resources/resources/3d/engine/...
```

No reported project compile error points to `assets/script/pathAdapter/LudoGlobalPathAdapter.ts`.

# Risk

Current skeleton does not yet activate QUICK public loop behavior. This is intentional until skeleton approval.

The next implementation step must replace the TODO fallback so:

- QUICK unopened chairs return `_publicLoopCache`.
- QUICK OPEN GATE chairs return `_cache`.
- CLASSIC and DEFAULT return `_cache`.

# Confirmation Question

Do you approve this skeleton and flow as the base for full phase implementation?
