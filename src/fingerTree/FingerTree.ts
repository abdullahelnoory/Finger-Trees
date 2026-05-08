/**
 * `FingerTree<V, A>` — Hinze & Paterson 2-3 finger tree.
 *
 * 👉 You implement this file. See {@link ../../TASK.md TASK.md} §3.1 for the
 * required public API (every name imported by `FingerTree.test.ts` and
 * `FingerTree.bench.ts` must be exported from here).
 *
 * Read freely:
 *   - `src/internal/fingerTree/**` — type IDs, `Affix` / `Node` algebra, predicates.
 *     Import the *types* and *predicates* (`isEmpty`, `isSingle`, `isDeep`).
 *     **Do not** copy the algorithms (`pushLeft`, `pushRight`, `viewLeft`,
 *     `viewRight`, `app3`, `splitTree`, …) — we will diff.
 *   - `src/utils/monoids.ts` (importable as `@monoids`).
 *   - `src/utils/trampoline.ts` (importable as `@trampoline`) — wrap recursive
 *     functions with `Trampoline.trampoline` and chain with `Trampoline.flatMap`.
 *
 * Reference paper: Hinze & Paterson, *Finger Trees: A Simple General-Purpose
 * Data Structure*, JFP 16(2), 2006.
 * https://www.staff.city.ac.uk/~ross/papers/FingerTree.pdf
 */
import * as O from "effect/Option";
import {
  DeepImpl,
  EmptyImpl,
  isEmpty,
  isDeep,
  isSingle,
  SingleImpl,
  type FingerTree as FT,
  type Split as Sp,
} from "../internal/fingerTree/FingerTree.ts";
import type { Measured } from "@monoids";
import type { Node } from "../internal/fingerTree/nodes.ts";
import { one, two, three, four, branch2, branch3 } from "../internal/fingerTree/nodes.ts";

const NOT_IMPLEMENTED = (name: string): never => {
  throw new Error(
    `FingerTree.${name} is not implemented yet. See TASK.md §3.1 and Hinze & Paterson §3.`,
  );
};

// Re-export the type so consumers can `import type { FingerTree } from "./FingerTree.ts"`.
export type FingerTree<V, A> = FT<V, A>;
export type Split<V, A> = Sp<V, A>;

// ---------------------------------------------------------------------------
// Construction
// ---------------------------------------------------------------------------
export const empty = <V, A>(_m: Measured<A, V>): FingerTree<V, A> => new EmptyImpl(_m);
export const single = <V, A>(_m: Measured<A, V>, _value: A): FingerTree<V, A> => new SingleImpl(_m, _value);
export const fromArray = <V, A>(
  xs: ReadonlyArray<A>,
  m: Measured<A, V>,
): FingerTree<V, A> => {
  const len = xs.length;
  
  if (len === 0) {
    return empty(m);
  }
  
  if (len === 1) {
    return single(m, xs[0]);
  }
  
  if (len === 2) {
    const prefix = one(m, xs[0]);
    const suffix = one(m, xs[1]);
    const annotation = m.combine(prefix.annotation, suffix.annotation);
    const emptyDeeper: FingerTree<V, Node<V, A>> = empty(m);
    return new DeepImpl(m, annotation, prefix, emptyDeeper, suffix);
  }
  
  if (len === 3) {
    const prefix = two(m, xs[0], xs[1]);
    const suffix = one(m, xs[2]);
    const annotation = m.combine(prefix.annotation, suffix.annotation);
    const emptyDeeper: FingerTree<V, Node<V, A>> = empty(m);
    return new DeepImpl(m, annotation, prefix, emptyDeeper, suffix);
  }
  
  if (len === 4) {
    const prefix = two(m, xs[0], xs[1]);
    const suffix = two(m, xs[2], xs[3]);
    const annotation = m.combine(prefix.annotation, suffix.annotation);
    const emptyDeeper: FingerTree<V, Node<V, A>> = empty(m);
    return new DeepImpl(m, annotation, prefix, emptyDeeper, suffix);
  }
  
  // For len >= 5, recursively build
  // Take first 4 as prefix, last 4 as suffix, build deeper from middle
  const prefix = four(m, xs[0], xs[1], xs[2], xs[3]);
  const suffix = four(m, xs[len - 4], xs[len - 3], xs[len - 2], xs[len - 1]);
  
  // Build nodes from middle elements
  const middle = xs.slice(4, len - 4);
  const nodes: Node<V, A>[] = [];
  
  // Group middle elements into 2s and 3s
  let i = 0;
  while (i < middle.length) {
    const remaining = middle.length - i;
    if (remaining >= 3) {
      // Take 3 or 4 elements
      if (remaining === 3 || remaining === 4) {
        // If 4 remaining, take 2 now and 2 later; if 3, take 3
        if (remaining === 4) {
          nodes.push(branch2(m, middle[i], middle[i + 1]));
          i += 2;
        } else {
          nodes.push(branch3(m, middle[i], middle[i + 1], middle[i + 2]));
          i += 3;
        }
      } else if (remaining === 5) {
        // Take 2, then 3
        nodes.push(branch2(m, middle[i], middle[i + 1]));
        i += 2;
      } else {
        // remaining > 5: take 3
        nodes.push(branch3(m, middle[i], middle[i + 1], middle[i + 2]));
        i += 3;
      }
    } else if (remaining === 2) {
      nodes.push(branch2(m, middle[i], middle[i + 1]));
      i += 2;
    } else {
      // remaining === 1, this shouldn't happen with proper logic
      // but handle it by taking it with the suffix (which we already did)
      break;
    }
  }
  
  // Create a measured instance for nodes
  const nodeMeasured: Measured<Node<V, A>, V> = {
    empty: m.empty,
    measure: (node: Node<V, A>) => node.annotation,
    combine: (v1: V, v2: V) => m.combine(v1, v2),
    combineAll: m.combineAll,
    combineMany: m.combineMany,
  };
  
  const deeper = fromArray(nodes, nodeMeasured);
  
  const annotation = m.combine(
    prefix.annotation,
    m.combine(
      (deeper as any).annotation || m.empty,
      suffix.annotation
    )
  );
  
  return new DeepImpl(m, annotation, prefix, deeper, suffix);
};

// ---------------------------------------------------------------------------
// Cons / Snoc / Views
// ---------------------------------------------------------------------------
export const prepend = <V, A>(_t: FingerTree<V, A>, _x: A): FingerTree<V, A> =>
  NOT_IMPLEMENTED("prepend");
export const append = <V, A>(_t: FingerTree<V, A>, _x: A): FingerTree<V, A> =>
  NOT_IMPLEMENTED("append");

export const head = <V, A>(_t: FingerTree<V, A>): O.Option<A> => {
  if (isEmpty(_t)) {
    return O.none();
  }
  if (isSingle(_t)) {
    return O.some(_t.value);
  }
  if (isDeep(_t)) {
    return O.some(_t.prefix.a);
  }
  return O.none();
};
export const last = <V, A>(_t: FingerTree<V, A>): O.Option<A> =>
  NOT_IMPLEMENTED("last");
export const tail = <V, A>(_t: FingerTree<V, A>): O.Option<FingerTree<V, A>> =>
  NOT_IMPLEMENTED("tail");
export const init = <V, A>(_t: FingerTree<V, A>): O.Option<FingerTree<V, A>> =>
  NOT_IMPLEMENTED("init");

// ---------------------------------------------------------------------------
// Concat & Split  (the two operations that justify finger trees)
// ---------------------------------------------------------------------------
export const concat = <V, A>(
  _l: FingerTree<V, A>,
  _r: FingerTree<V, A>,
): FingerTree<V, A> => NOT_IMPLEMENTED("concat");

export const split = <V, A>(
  _predicate: (v: V) => boolean,
  _start: V,
  _t: FingerTree<V, A>,
): O.Option<Split<V, A>> => NOT_IMPLEMENTED("split");

// ---------------------------------------------------------------------------
// Higher-order traversals
// ---------------------------------------------------------------------------
export const map = <V, A, B>(
  _t: FingerTree<V, A>,
  _f: (a: A) => B,
  _m: Measured<B, V>,
): FingerTree<V, B> => NOT_IMPLEMENTED("map");

export const foldl = <V, A, B>(
  _f: (acc: B, a: A) => B,
  _init: B,
  _t: FingerTree<V, A>,
): B => NOT_IMPLEMENTED("foldl");

export const foldr = <V, A, B>(
  _f: (a: A, acc: B) => B,
  _init: B,
  _t: FingerTree<V, A>,
): B => NOT_IMPLEMENTED("foldr");
