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
import type * as O from "effect/Option";
import type { Order } from "effect/Order";

const NOT_IMPLEMENTED = (name: string): never => {
  throw new Error(
    `FingerPriorityQueue.${name} is not implemented yet. See TASK.md §3.2.`,
  );
};

// Replace `unknown` with your concrete class once you implement it.
export type FingerPriorityQueue<P, A> = {
  readonly _P: (_: never) => P;
  readonly _A: (_: never) => A;
  readonly size: number;
};

export type Prioritized<P, A> = {
  readonly priority: P;
  readonly item: A;
};

export const empty = <P, A>(
  _order: Order<P>,
  _emptyPriority: P,
): FingerPriorityQueue<P, A> => NOT_IMPLEMENTED("empty");

export const fromArray = <P, A>(
  _xs: ReadonlyArray<Prioritized<P, A>>,
  _order: Order<P>,
  _emptyPriority: P,
): FingerPriorityQueue<P, A> => NOT_IMPLEMENTED("fromArray");

export const push = <P, A>(
  _q: FingerPriorityQueue<P, A>,
  _item: A,
  _priority: P,
): FingerPriorityQueue<P, A> => NOT_IMPLEMENTED("push");

export const pop = <P, A>(
  _q: FingerPriorityQueue<P, A>,
): O.Option<[Prioritized<P, A>, FingerPriorityQueue<P, A>]> =>
  NOT_IMPLEMENTED("pop");

export const peek = <P, A>(
  _q: FingerPriorityQueue<P, A>,
): O.Option<Prioritized<P, A>> => NOT_IMPLEMENTED("peek");

export const size = <P, A>(_q: FingerPriorityQueue<P, A>): number =>
  _q.size;
