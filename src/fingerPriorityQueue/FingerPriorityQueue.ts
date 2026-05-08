/**
 * `FingerPriorityQueue<P, A>` — a max-priority queue built on top of a
 * measured `FingerTree`, where the monoidal annotation is the priority and
 * `pop` is implemented via `split` against the tree's annotation.
 *
 * 👉 You implement this file. See {@link ../../TASK.md TASK.md} §3.2 for the
 * required public API.
 *
 * Hints:
 *   - Use {@link "@monoids".getPriorityMonoid} to derive the `Measured` instance
 *     from the user-supplied `Order<P>`.
 *   - `peek` / `pop` should `split` on the tree at the maximum priority
 *     (which is the tree's `annotation`). Equal priorities must yield FIFO order.
 *   - The class must implement `Pipeable` and `Inspectable` (Effect interfaces).
 */
import * as O from "effect/Option";
import type { Order } from "effect/Order";
import { format, type Inspectable, toJSON } from "effect/Inspectable";
import { type Pipeable, pipeArguments } from "effect/Pipeable";
import { getPriorityMonoid } from "../utils/monoids.ts";
import { empty as ftEmpty, fromArray as ftFromArray, append, split, isEmpty, concat } from "../fingerTree/FingerTree.ts";
import type { FingerTree } from "../fingerTree/FingerTree.ts";

export type Prioritized<P, A> = {
  readonly priority: P;
  readonly item: A;
};

export class FingerPriorityQueueImpl<P, A> implements Pipeable, Inspectable {
  readonly _P: (_: never) => P = undefined as any;
  readonly _A: (_: never) => A = undefined as any;
  
  constructor(
    public readonly tree: FingerTree<P, Prioritized<P, A>>,
    public readonly order: Order<P>,
    public readonly emptyPriority: P,
    public readonly size: number
  ) {}

  pipe() {
    return pipeArguments(this, arguments);
  }

  toJSON() {
    return {
      _id: "FingerPriorityQueue",
      size: this.size,
    };
  }

  toString() {
    return format(this.toJSON());
  }

  [Symbol.for("nodejs.util.inspect.custom")]() {
    return this.toJSON();
  }
}

export type FingerPriorityQueue<P, A> = FingerPriorityQueueImpl<P, A>;

export const empty = <P, A>(
  order: Order<P>,
  emptyPriority: P,
): FingerPriorityQueue<P, A> => {
  const m = getPriorityMonoid<P, Prioritized<P, A>>(order, emptyPriority);
  return new FingerPriorityQueueImpl(ftEmpty(m), order, emptyPriority, 0);
};

export const fromArray = <P, A>(
  xs: ReadonlyArray<Prioritized<P, A>>,
  order: Order<P>,
  emptyPriority: P,
): FingerPriorityQueue<P, A> => {
  const m = getPriorityMonoid<P, Prioritized<P, A>>(order, emptyPriority);
  return new FingerPriorityQueueImpl(ftFromArray(xs, m), order, emptyPriority, xs.length);
};

export const push = <P, A>(
  q: FingerPriorityQueue<P, A>,
  item: A,
  priority: P,
): FingerPriorityQueue<P, A> => {
  return new FingerPriorityQueueImpl(append(q.tree, { priority, item }), q.order, q.emptyPriority, q.size + 1);
};

export const pop = <P, A>(
  q: FingerPriorityQueue<P, A>,
): O.Option<[Prioritized<P, A>, FingerPriorityQueue<P, A>]> => {
  if (q.size === 0 || isEmpty(q.tree)) {
    return O.none();
  }
  
  const maxPriority = q.tree.annotation;
  const pred = (v: P) => q.order(v, maxPriority) >= 0;
  
  const splitResult = split(pred, q.emptyPriority, q.tree);
  if (O.isNone(splitResult)) {
    return O.none();
  }
  
  const { left, value, right } = splitResult.value;
  const newTree = concat(left, right);
  
  return O.some([value, new FingerPriorityQueueImpl(newTree, q.order, q.emptyPriority, q.size - 1)]);
};

export const peek = <P, A>(
  q: FingerPriorityQueue<P, A>,
): O.Option<Prioritized<P, A>> => {
  if (q.size === 0 || isEmpty(q.tree)) {
    return O.none();
  }
  
  const maxPriority = q.tree.annotation;
  const pred = (v: P) => q.order(v, maxPriority) >= 0;
  
  const splitResult = split(pred, q.emptyPriority, q.tree);
  if (O.isNone(splitResult)) {
    return O.none();
  }
  
  return O.some(splitResult.value.value);
};

export const size = <P, A>(q: FingerPriorityQueue<P, A>): number => q.size;
