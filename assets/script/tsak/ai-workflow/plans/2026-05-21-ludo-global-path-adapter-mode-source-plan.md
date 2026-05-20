# Ludo Global Path Adapter Mode Source Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add game-mode aware path source routing to `LudoGlobalPathAdapter` so CLASSIC uses full paths, QUICK uses public loop paths until each chair reaches OPEN GATE.

**Architecture:** Keep `LudoGlobalPathAdapter` as the owner of path source state only. Route existing path queries through `getPlayerPath(chairIndex)` so existing public APIs stay stable. OPEN GATE detection remains outside the adapter and is reported through a one-way marking API.

**Tech Stack:** Cocos Creator 3.8.x, TypeScript, existing Ludo path adapter system.

---

## Source Spec

`D:\cocosTest\ludo\LUDO\assets\script\tsak\ai-workflow\specs\2026-05-21-ludo-global-path-adapter-mode-source-spec.md`

## Implementation Boundary

- Modify only `assets/script/pathAdapter/LudoGlobalPathAdapter.ts` in Phase 1.
- Do not modify `BasicPathGenerator`.
- Do not modify `BasicViewTransformer`.
- Do not modify `LudoPathViewResolver`.
- Do not implement OPEN GATE rule detection inside `LudoGlobalPathAdapter`.
- Do not change existing public method signatures.
- Do not introduce Cocos lifecycle callbacks, listeners, tweens, schedules, promises, or Spine callbacks.

## File Structure

- Modify: `assets/script/pathAdapter/LudoGlobalPathAdapter.ts`
  - Import `LudoGameMode`.
  - Add `_gameMode`.
  - Add `_quickOpenGateChairSet`.
  - Add game mode set/get APIs.
  - Add OPEN GATE state APIs.
  - Route `getPlayerPath(chairIndex)` by current mode and chair gate state.
  - Keep existing cache builders unchanged.

No new production files are required for Phase 1.

---

## Phase 1: Adapter State And Path Routing

### Task 1: Add Game Mode And OPEN GATE State

**Files:**
- Modify: `assets/script/pathAdapter/LudoGlobalPathAdapter.ts`

- [ ] **Step 1: Add the game mode import**

Add this import at the top of `LudoGlobalPathAdapter.ts`:

```ts
import { LudoGameMode } from '../gameDef/GameDef';
```

Expected result: the file can reference `LudoGameMode.CLASSIC`, `LudoGameMode.QUICK`, and `LudoGameMode.DEFAULT`.

- [ ] **Step 2: Add adapter state fields**

Inside `export class LudoGlobalPathAdapter`, after the two existing cache fields, add:

```ts
    private _gameMode: LudoGameMode = LudoGameMode.CLASSIC;
    private readonly _quickOpenGateChairSet: Set<number> = new Set();
```

Expected result:
- `_gameMode` defaults to CLASSIC for backward-compatible behavior.
- `_quickOpenGateChairSet` stores only chair indexes that have reached OPEN GATE in QUICK mode.
- The Set stores numbers only, complying with project Set/Map rules.

- [ ] **Step 3: Add game mode accessors**

Add these public methods before `getPlayerPath(chairIndex: number)`:

```ts
    public setGameMode(gameMode: LudoGameMode): void {
        if (this._gameMode === gameMode) {
            return;
        }

        this._gameMode = gameMode;
    }

    public getGameMode(): LudoGameMode {
        return this._gameMode;
    }
```

Expected result:
- External orchestration can set the adapter mode during game setup.
- Existing cache data is not cleared because `_cache` and `_publicLoopCache` are deterministic by chair index and reusable across modes.

- [ ] **Step 4: Add OPEN GATE APIs**

Add these public methods after the game mode accessors:

```ts
    public markQuickOpenGate(chairIndex: number): void {
        if (!this.isValidChairIndex(chairIndex)) {
            return;
        }

        this._quickOpenGateChairSet.add(chairIndex);
    }

    public isQuickOpenGate(chairIndex: number): boolean {
        return this._quickOpenGateChairSet.has(chairIndex);
    }

    public resetQuickOpenGateState(): void {
        this._quickOpenGateChairSet.clear();
    }
```

Expected result:
- OPEN GATE can only be marked true per chair.
- Repeated calls are idempotent.
- Game end or table change can reset all chairs together.

- [ ] **Step 5: Add chair validation helper**

Add this private method before `buildPath(chairIndex: number)`:

```ts
    private isValidChairIndex(chairIndex: number): boolean {
        return chairIndex >= 0 && chairIndex < LUDO_BOARD_CONST.PLAYER_START.length;
    }
```

Expected result:
- `markQuickOpenGate` does not mutate state for invalid chair indexes.
- Existing path builder behavior is preserved for existing callers.

### Task 2: Route getPlayerPath By Mode And Chair State

**Files:**
- Modify: `assets/script/pathAdapter/LudoGlobalPathAdapter.ts`

- [ ] **Step 1: Replace `getPlayerPath` body**

Replace the current `getPlayerPath(chairIndex: number): number[]` body with:

```ts
    public getPlayerPath(chairIndex: number): number[] {
        if (this.shouldUseFullPath(chairIndex)) {
            return this.getFullPlayerPath(chairIndex);
        }

        return this.getPlayerPublicLoopPath(chairIndex);
    }
```

Expected result:
- Existing public API stays the same.
- All existing path query methods that call `getPlayerPath` become mode-aware.

- [ ] **Step 2: Add full path helper**

Add this private method before `isValidChairIndex(chairIndex: number)`:

```ts
    private getFullPlayerPath(chairIndex: number): number[] {
        if (!this._cache.has(chairIndex)) {
            this._cache.set(chairIndex, this.buildPath(chairIndex));
        }
        return this._cache.get(chairIndex)!;
    }
```

Expected result:
- Existing full path cache behavior is preserved exactly.
- `getPlayerPath` no longer owns cache construction directly.

- [ ] **Step 3: Add path source rule helper**

Add this private method before `getFullPlayerPath(chairIndex: number)`:

```ts
    private shouldUseFullPath(chairIndex: number): boolean {
        if (this._gameMode === LudoGameMode.QUICK) {
            return this.isQuickOpenGate(chairIndex);
        }

        return true;
    }
```

Expected result:
- CLASSIC uses full path.
- DEFAULT falls back to full path.
- QUICK uses public loop until a chair is marked OPEN GATE.

### Task 3: Focused TypeScript Verification

**Files:**
- Verify: `assets/script/pathAdapter/LudoGlobalPathAdapter.ts`

- [ ] **Step 1: Run scoped TypeScript compile**

Run:

```powershell
npx --no-install tsc --noEmit --skipLibCheck --target es6 --lib dom,dom.iterable,esnext --module commonjs --noResolve "D:\cocosTest\ludo\LUDO\assets\script\pathAdapter\LudoGlobalPathAdapter.ts"
```

Expected: command exits with code 0.

- [ ] **Step 2: If scoped compile fails because imported project types need full project context, run project compile**

Run:

```powershell
npx --no-install tsc --noEmit -p "D:\cocosTest\ludo\LUDO\tsconfig.json"
```

Expected: command exits with code 0, or any unrelated existing project errors are documented separately from this change.

- [ ] **Step 3: Manually inspect public API compatibility**

Confirm these existing methods still exist with the same signatures:

```ts
public getPlayerPath(chairIndex: number): number[]
public getPlayerPublicLoopPath(chairIndex: number): number[]
public getMovePath(chairIndex: number, fromPos: number, toPos: number): number[]
public getPathIndex(chairIndex: number, gridPos: number): number
public getStepsToFinish(chairIndex: number, gridPos: number): number
public isFinished(chairIndex: number, gridPos: number): boolean
public isInBase(gridPos: number): boolean
public getBaseSlotId(chairIndex: number, pieceIndex: number): number
```

Expected: no existing public method is renamed or removed.

### Task 4: Manual Behavior Check

**Files:**
- Verify: `assets/script/pathAdapter/LudoGlobalPathAdapter.ts`

- [ ] **Step 1: Confirm CLASSIC default behavior**

Inspect the implementation:

```ts
private _gameMode: LudoGameMode = LudoGameMode.CLASSIC;
```

Expected:
- A new adapter instance defaults to CLASSIC.
- `getPlayerPath(0)` uses `getFullPlayerPath(0)`.

- [ ] **Step 2: Confirm QUICK before OPEN GATE**

Inspect `shouldUseFullPath`:

```ts
if (this._gameMode === LudoGameMode.QUICK) {
    return this.isQuickOpenGate(chairIndex);
}
```

Expected:
- In QUICK mode, unmarked chairs return false from `shouldUseFullPath`.
- `getPlayerPath(chairIndex)` returns `getPlayerPublicLoopPath(chairIndex)`.

- [ ] **Step 3: Confirm QUICK after OPEN GATE**

Inspect `markQuickOpenGate` and `shouldUseFullPath`.

Expected:
- After `markQuickOpenGate(1)`, chair 1 returns full path in QUICK mode.
- Chairs 0, 2, and 3 still use public loop path until individually marked.

- [ ] **Step 4: Confirm reset scope**

Inspect:

```ts
public resetQuickOpenGateState(): void {
    this._quickOpenGateChairSet.clear();
}
```

Expected:
- Game end or table change can clear all QUICK OPEN GATE state.
- No API exists to set one chair back to false during a game/table lifecycle.

---

## Phase 2: External Orchestration Review

This phase is review-only unless integration points are explicitly approved.

### Task 1: Locate Adapter Ownership And Call Sites

**Files:**
- Search only unless integration is approved.

- [ ] **Step 1: Search for adapter construction and path resolver construction**

Run:

```powershell
rg "new LudoGlobalPathAdapter|LudoGlobalPathAdapter|LudoPathViewResolver" -n "D:\cocosTest\ludo\LUDO\assets\script"
```

Expected:
- Identify where `setGameMode`, `markQuickOpenGate`, and `resetQuickOpenGateState` should eventually be called.

- [ ] **Step 2: Report integration recommendation**

Expected report must answer:

- Which object owns game mode setup?
- Which object detects OPEN GATE?
- Which object detects game end or table change?
- Should Phase 3 connect these calls now, or pause after adapter API implementation?

---

## Final Verification Checklist

- [ ] TypeScript compile command attempted.
- [ ] No unresolved promise introduced.
- [ ] No callback introduced.
- [ ] No tween introduced.
- [ ] No event listener introduced.
- [ ] No schedule introduced.
- [ ] No pool reference introduced.
- [ ] No Cocos lifecycle method introduced.
- [ ] Existing public APIs preserved.
- [ ] QUICK OPEN GATE state remains chair-level and one-way until reset.

## Phase Checkpoint Output Required

After Phase 1 implementation and verification, report:

- Current workflow mode
- Current phase
- Execution status
- Completed tasks
- Review status
- Verification evidence
- Remaining risk
- Blocking issue
- Workspace change status
- Next available actions
- Recommended next step
