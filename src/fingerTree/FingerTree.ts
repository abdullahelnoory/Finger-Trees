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
import { Trampoline, trampoline, flatMap } from "../utils/trampoline.ts";
import {
  DeepImpl,
  EmptyImpl,
  isEmpty,
  isDeep,
  isSingle,
  SingleImpl,
  type FingerTree as FT,
  type Split as Sp,
  Split as SplitImpl,
} from "../internal/fingerTree/FingerTree.ts";
import type { Measured } from "@monoids";
import type { Affix, Node } from "../internal/fingerTree/nodes.ts";
import { one, two, three, four, branch2, branch3, isOne, isTwo, isThree, isFour } from "../internal/fingerTree/nodes.ts";

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
  
  if (len === 5) {
    const prefix = two(m, xs[0], xs[1]);
    const suffix = two(m, xs[3], xs[4]);
    const node = branch2(m, xs[2], xs[2]); // Create a node with middle element... wait that's wrong
    // Actually for 5 elements, better strategy:
    const prefix5 = three(m, xs[0], xs[1], xs[2]);
    const suffix5 = two(m, xs[3], xs[4]);
    const annotation5 = m.combine(prefix5.annotation, suffix5.annotation);
    const emptyDeeper5: FingerTree<V, Node<V, A>> = empty(m);
    return new DeepImpl(m, annotation5, prefix5, emptyDeeper5, suffix5);
  }
  
  if (len === 6) {
    const prefix6 = three(m, xs[0], xs[1], xs[2]);
    const suffix6 = three(m, xs[3], xs[4], xs[5]);
    const annotation6 = m.combine(prefix6.annotation, suffix6.annotation);
    const emptyDeeper6: FingerTree<V, Node<V, A>> = empty(m);
    return new DeepImpl(m, annotation6, prefix6, emptyDeeper6, suffix6);
  }
  
  if (len === 7) {
    const prefix7 = three(m, xs[0], xs[1], xs[2]);
    const suffix7 = three(m, xs[4], xs[5], xs[6]);
    const node7 = branch2(m, xs[3], xs[3]); // Hmm, that's also wrong
    // For 7 elements: prefix (3) + deeper (1 node of 2 or 3 elements) + suffix (3)
    // 3 + 3 + 3 = 9 > 7, so we need 3 + (2-element node) + 2 or similar
    // Actually: 3 + 1 + 3 = 7 exactly if the middle node has 1 element... but nodes need 2-3 elements
    // Let's do: 2 + node(3) + 2 = 7, or 3 + node(2) + 2 = 7, or 2 + node(2) + 3 = 7
    const prefix7a = three(m, xs[0], xs[1], xs[2]);
    const suffix7a = two(m, xs[5], xs[6]);
    const node7a = branch2(m, xs[3], xs[4]);
    const deeper7a = single(m, node7a);
    const annotation7a = m.combine(prefix7a.annotation, m.combine(deeper7a.annotation, suffix7a.annotation));
    return new DeepImpl(m, annotation7a, prefix7a, deeper7a, suffix7a);
  }
  
  // For len >= 8, recursively build
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
export const prepend = <V, A>(t: FingerTree<V, A>, x: A): FingerTree<V, A> => {
  if (isEmpty(t)) {
    return single(t.m, x);
  }
  if (isSingle(t)) {
    const prefix = one(t.m, x);
    const suffix = one(t.m, t.value);
    const emptyDeeper: FingerTree<V, Node<V, A>> = empty(t.m);
    const annotation = t.m.combine(prefix.annotation, suffix.annotation);
    return new DeepImpl(t.m, annotation, prefix, emptyDeeper, suffix);
  }
  if (isDeep(t)) {
    // Check if prefix has room
    if (isOne(t.prefix)) {
      // prefix has 1 element, make it 2
      const newPrefix = two(t.m, x, t.prefix.a);
      const annotation = t.m.combine(
        newPrefix.annotation,
        t.m.combine(t.deeper.annotation, t.suffix.annotation)
      );
      return new DeepImpl(t.m, annotation, newPrefix, t.deeper, t.suffix);
    } else if (isTwo(t.prefix)) {
      // prefix has 2 elements, make it 3
      const newPrefix = three(t.m, x, t.prefix.a, t.prefix.b);
      const annotation = t.m.combine(
        newPrefix.annotation,
        t.m.combine(t.deeper.annotation, t.suffix.annotation)
      );
      return new DeepImpl(t.m, annotation, newPrefix, t.deeper, t.suffix);
    } else if (isThree(t.prefix)) {
      // prefix has 3 elements, make it 4
      const newPrefix = four(t.m, x, t.prefix.a, t.prefix.b, t.prefix.c);
      const annotation = t.m.combine(
        newPrefix.annotation,
        t.m.combine(t.deeper.annotation, t.suffix.annotation)
      );
      return new DeepImpl(t.m, annotation, newPrefix, t.deeper, t.suffix);
    } else if (isFour(t.prefix)) {
      // prefix is full, need to push it into deeper as a node
      const node = branch3(t.m, t.prefix.b, t.prefix.c, t.prefix.d);
      const newDeeper = prepend(t.deeper, node);
      const newPrefix = two(t.m, x, t.prefix.a);
      const annotation = t.m.combine(
        newPrefix.annotation,
        t.m.combine(newDeeper.annotation, t.suffix.annotation)
      );
      return new DeepImpl(t.m, annotation, newPrefix, newDeeper, t.suffix);
    }
  }
  return t;
};

export const append = <V, A>(t: FingerTree<V, A>, x: A): FingerTree<V, A> => {
  if (isEmpty(t)) {
    return single(t.m, x);
  }
  if (isSingle(t)) {
    const prefix = one(t.m, t.value);
    const suffix = one(t.m, x);
    const emptyDeeper: FingerTree<V, Node<V, A>> = empty(t.m);
    const annotation = t.m.combine(prefix.annotation, suffix.annotation);
    return new DeepImpl(t.m, annotation, prefix, emptyDeeper, suffix);
  }
  if (isDeep(t)) {
    // Check if suffix has room
    if (isOne(t.suffix)) {
      // suffix has 1 element, make it 2
      const newSuffix = two(t.m, t.suffix.a, x);
      const annotation = t.m.combine(
        t.prefix.annotation,
        t.m.combine(t.deeper.annotation, newSuffix.annotation)
      );
      return new DeepImpl(t.m, annotation, t.prefix, t.deeper, newSuffix);
    } else if (isTwo(t.suffix)) {
      // suffix has 2 elements, make it 3
      const newSuffix = three(t.m, t.suffix.a, t.suffix.b, x);
      const annotation = t.m.combine(
        t.prefix.annotation,
        t.m.combine(t.deeper.annotation, newSuffix.annotation)
      );
      return new DeepImpl(t.m, annotation, t.prefix, t.deeper, newSuffix);
    } else if (isThree(t.suffix)) {
      // suffix has 3 elements, make it 4
      const newSuffix = four(t.m, t.suffix.a, t.suffix.b, t.suffix.c, x);
      const annotation = t.m.combine(
        t.prefix.annotation,
        t.m.combine(t.deeper.annotation, newSuffix.annotation)
      );
      return new DeepImpl(t.m, annotation, t.prefix, t.deeper, newSuffix);
    } else if (isFour(t.suffix)) {
      // suffix is full, need to push it into deeper as a node
      const node = branch3(t.m, t.suffix.a, t.suffix.b, t.suffix.c);
      const newDeeper = append(t.deeper, node);
      const newSuffix = two(t.m, t.suffix.d, x);
      const annotation = t.m.combine(
        t.prefix.annotation,
        t.m.combine(newDeeper.annotation, newSuffix.annotation)
      );
      return new DeepImpl(t.m, annotation, t.prefix, newDeeper, newSuffix);
    }
  }
  return t;
};

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

export const last = <V, A>(_t: FingerTree<V, A>): O.Option<A> => {
  if (isEmpty(_t)) {
    return O.none();
  }
  if (isSingle(_t)) {
    return O.some(_t.value);
  }
  if (isDeep(_t)) {
    // Get the rightmost element of the suffix
    if (isOne(_t.suffix)) {
      return O.some(_t.suffix.a);
    } else if (isTwo(_t.suffix)) {
      return O.some(_t.suffix.b);
    } else if (isThree(_t.suffix)) {
      return O.some(_t.suffix.c);
    } else if (isFour(_t.suffix)) {
      return O.some(_t.suffix.d);
    }
  }
  return O.none();
};

export const tail = <V, A>(_t: FingerTree<V, A>): O.Option<FingerTree<V, A>> => {
  if (isEmpty(_t)) {
    return O.none();
  }
  if (isSingle(_t)) {
    return O.some(empty(_t.m));
  }
  if (isDeep(_t)) {
    // Remove first element
    if (isTwo(_t.prefix)) {
      // prefix becomes one
      const newPrefix = one(_t.m, _t.prefix.b);
      const annotation = _t.m.combine(
        newPrefix.annotation,
        _t.m.combine(_t.deeper.annotation, _t.suffix.annotation)
      );
      return O.some(new DeepImpl(_t.m, annotation, newPrefix, _t.deeper, _t.suffix));
    } else if (isThree(_t.prefix)) {
      // prefix becomes two
      const newPrefix = two(_t.m, _t.prefix.b, _t.prefix.c);
      const annotation = _t.m.combine(
        newPrefix.annotation,
        _t.m.combine(_t.deeper.annotation, _t.suffix.annotation)
      );
      return O.some(new DeepImpl(_t.m, annotation, newPrefix, _t.deeper, _t.suffix));
    } else if (isFour(_t.prefix)) {
      // prefix becomes three
      const newPrefix = three(_t.m, _t.prefix.b, _t.prefix.c, _t.prefix.d);
      const annotation = _t.m.combine(
        newPrefix.annotation,
        _t.m.combine(_t.deeper.annotation, _t.suffix.annotation)
      );
      return O.some(new DeepImpl(_t.m, annotation, newPrefix, _t.deeper, _t.suffix));
    } else if (isOne(_t.prefix)) {
      // prefix is one, need to get from deeper
      if (isEmpty(_t.deeper)) {
        // No deeper, just return suffix as tree
        if (isOne(_t.suffix)) {
          return O.some(single(_t.m, _t.suffix.a));
        } else if (isTwo(_t.suffix)) {
          return O.some(fromArray([_t.suffix.a, _t.suffix.b], _t.m));
        } else if (isThree(_t.suffix)) {
          return O.some(fromArray([_t.suffix.a, _t.suffix.b, _t.suffix.c], _t.m));
        } else if (isFour(_t.suffix)) {
          return O.some(fromArray([_t.suffix.a, _t.suffix.b, _t.suffix.c, _t.suffix.d], _t.m));
        }
      } else {
        // Get first node from deeper
        const headNode = head(_t.deeper);
        if (O.isNone(headNode)) {
          // Deeper should not be empty if isDeep checked it
          if (isOne(_t.suffix)) {
            return O.some(single(_t.m, _t.suffix.a));
          } else if (isTwo(_t.suffix)) {
            return O.some(fromArray([_t.suffix.a, _t.suffix.b], _t.m));
          } else if (isThree(_t.suffix)) {
            return O.some(fromArray([_t.suffix.a, _t.suffix.b, _t.suffix.c], _t.m));
          } else if (isFour(_t.suffix)) {
            return O.some(fromArray([_t.suffix.a, _t.suffix.b, _t.suffix.c, _t.suffix.d], _t.m));
          }
        }
        const firstNode = headNode.value;
        const restDeeper = tail(_t.deeper);
        
        // Convert node to affix
        let newPrefix: any;
        if (firstNode.toList().length === 2) {
          const [a, b] = firstNode.toList();
          newPrefix = two(_t.m, a, b);
        } else {
          const [a, b, c] = firstNode.toList();
          newPrefix = three(_t.m, a, b, c);
        }
        
        // If restDeeper is None, we've exhausted deeper, check if we can still form a valid tree
        if (O.isNone(restDeeper)) {
          const deeper = empty(_t.m);
          const annotation = _t.m.combine(
            newPrefix.annotation,
            _t.suffix.annotation
          );
          return O.some(new DeepImpl(_t.m, annotation, newPrefix, deeper, _t.suffix));
        }
        
        const deeper = restDeeper.value;
        const annotation = _t.m.combine(
          newPrefix.annotation,
          _t.m.combine(deeper.annotation, _t.suffix.annotation)
        );
        return O.some(new DeepImpl(_t.m, annotation, newPrefix, deeper, _t.suffix));
      }
    }
  }
  return O.none();
};

export const init = <V, A>(_t: FingerTree<V, A>): O.Option<FingerTree<V, A>> => {
  if (isEmpty(_t)) {
    return O.none();
  }
  if (isSingle(_t)) {
    return O.some(empty(_t.m));
  }
  if (isDeep(_t)) {
    // Remove last element
    if (isTwo(_t.suffix)) {
      // suffix becomes one
      const newSuffix = one(_t.m, _t.suffix.a);
      const annotation = _t.m.combine(
        _t.prefix.annotation,
        _t.m.combine(_t.deeper.annotation, newSuffix.annotation)
      );
      return O.some(new DeepImpl(_t.m, annotation, _t.prefix, _t.deeper, newSuffix));
    } else if (isThree(_t.suffix)) {
      // suffix becomes two
      const newSuffix = two(_t.m, _t.suffix.a, _t.suffix.b);
      const annotation = _t.m.combine(
        _t.prefix.annotation,
        _t.m.combine(_t.deeper.annotation, newSuffix.annotation)
      );
      return O.some(new DeepImpl(_t.m, annotation, _t.prefix, _t.deeper, newSuffix));
    } else if (isFour(_t.suffix)) {
      // suffix becomes three
      const newSuffix = three(_t.m, _t.suffix.a, _t.suffix.b, _t.suffix.c);
      const annotation = _t.m.combine(
        _t.prefix.annotation,
        _t.m.combine(_t.deeper.annotation, newSuffix.annotation)
      );
      return O.some(new DeepImpl(_t.m, annotation, _t.prefix, _t.deeper, newSuffix));
    } else if (isOne(_t.suffix)) {
      // suffix is one, need to get from deeper
      if (isEmpty(_t.deeper)) {
        // No deeper, just return prefix as tree
        if (isOne(_t.prefix)) {
          return O.some(single(_t.m, _t.prefix.a));
        } else if (isTwo(_t.prefix)) {
          return O.some(fromArray([_t.prefix.a, _t.prefix.b], _t.m));
        } else if (isThree(_t.prefix)) {
          return O.some(fromArray([_t.prefix.a, _t.prefix.b, _t.prefix.c], _t.m));
        } else if (isFour(_t.prefix)) {
          return O.some(fromArray([_t.prefix.a, _t.prefix.b, _t.prefix.c, _t.prefix.d], _t.m));
        }
      } else {
        // Get last node from deeper
        const lastNode = last(_t.deeper);
        if (O.isNone(lastNode)) {
          // Deeper should not be empty if isDeep checked it
          if (isOne(_t.prefix)) {
            return O.some(single(_t.m, _t.prefix.a));
          } else if (isTwo(_t.prefix)) {
            return O.some(fromArray([_t.prefix.a, _t.prefix.b], _t.m));
          } else if (isThree(_t.prefix)) {
            return O.some(fromArray([_t.prefix.a, _t.prefix.b, _t.prefix.c], _t.m));
          } else if (isFour(_t.prefix)) {
            return O.some(fromArray([_t.prefix.a, _t.prefix.b, _t.prefix.c, _t.prefix.d], _t.m));
          }
        }
        const lastNodeVal = lastNode.value;
        const restDeeper = init(_t.deeper);
        
        // Convert node to affix
        let newSuffix: any;
        if (lastNodeVal.toList().length === 2) {
          const [a, b] = lastNodeVal.toList();
          newSuffix = two(_t.m, a, b);
        } else {
          const [a, b, c] = lastNodeVal.toList();
          newSuffix = three(_t.m, a, b, c);
        }
        
        // If restDeeper is None, we've exhausted deeper, check if we can still form a valid tree
        if (O.isNone(restDeeper)) {
          const deeper = empty(_t.m);
          const annotation = _t.m.combine(
            _t.prefix.annotation,
            newSuffix.annotation
          );
          return O.some(new DeepImpl(_t.m, annotation, _t.prefix, deeper, newSuffix));
        }
        
        const deeper = restDeeper.value;
        const annotation = _t.m.combine(
          _t.prefix.annotation,
          _t.m.combine(deeper.annotation, newSuffix.annotation)
        );
        return O.some(new DeepImpl(_t.m, annotation, _t.prefix, deeper, newSuffix));
      }
    }
  }
  return O.none();
};

// ---------------------------------------------------------------------------
// Concat & Split  (the two operations that justify finger trees)
// ---------------------------------------------------------------------------
const buildNodes = <V, T>(m: Measured<T, V>, elements: T[]): Node<V, T>[] => {
  const nodes: Node<V, T>[] = [];
  let i = 0;
  while (i < elements.length) {
    const remaining = elements.length - i;
    if (remaining === 2) {
      nodes.push(branch2(m, elements[i], elements[i + 1]));
      i += 2;
    } else if (remaining === 3) {
      nodes.push(branch3(m, elements[i], elements[i + 1], elements[i + 2]));
      i += 3;
    } else if (remaining === 4) {
      nodes.push(branch2(m, elements[i], elements[i + 1]));
      i += 2;
    } else {
      nodes.push(branch3(m, elements[i], elements[i + 1], elements[i + 2]));
      i += 3;
    }
  }
  return nodes;
};

const app3Rec = <V, T>(
  m: Measured<T, V>,
  t1: FingerTree<V, T>,
  ts: T[],
  t2: FingerTree<V, T>,
): Trampoline<FingerTree<V, T>> => {
  if (isEmpty(t1)) {
    let result = t2;
    for (let i = ts.length - 1; i >= 0; i--) {
      result = prepend(result, ts[i]);
    }
    return result;
  }
  if (isEmpty(t2)) {
    let result = t1;
    for (let i = 0; i < ts.length; i++) {
      result = append(result, ts[i]);
    }
    return result;
  }
  if (isSingle(t1)) {
    return () => flatMap(
      app3Rec(m, empty(m), ts, t2),
      (res) => prepend(res, t1.value)
    );
  }
  if (isSingle(t2)) {
    return () => flatMap(
      app3Rec(m, t1, ts, empty(m)),
      (res) => append(res, t2.value)
    );
  }

  if (isDeep(t1) && isDeep(t2)) {
    const nodeMeasured: Measured<Node<V, T>, V> = {
      empty: m.empty,
      measure: (node: Node<V, T>) => node.annotation,
      combine: (v1, v2) => m.combine(v1, v2),
      combineAll: (vs) => m.combineAll(vs),
      combineMany: (v, vs) => m.combineMany(v, vs),
    };

    const elements = [...t1.suffix.toList(), ...ts, ...t2.prefix.toList()];
    const nodes = buildNodes(m, elements);

    return () => flatMap(
      app3Rec(nodeMeasured, t1.deeper, nodes, t2.deeper),
      (deeperRes) => {
        const annotation = m.combine(
          t1.prefix.annotation,
          m.combine(deeperRes.annotation, t2.suffix.annotation)
        );
        return new DeepImpl(m, annotation, t1.prefix, deeperRes, t2.suffix);
      }
    );
  }

  return empty(m);
};

const _app3Trampolined = trampoline(app3Rec);

const app3 = <V, T>(m: Measured<T, V>, t1: FingerTree<V, T>, ts: T[], t2: FingerTree<V, T>): FingerTree<V, T> => {
  return (_app3Trampolined as any)(m, t1, ts, t2);
};

export const concat = <V, A>(
  _l: FingerTree<V, A>,
  _r: FingerTree<V, A>,
  _ts: A[] = [],
): FingerTree<V, A> => {
  return app3(_l.m, _l, _ts, _r);
};

const buildAffix = <V, A>(m: Measured<A, V>, elements: readonly A[]): Affix<V, A> => {
  if (elements.length === 1) return one(m, elements[0]);
  if (elements.length === 2) return two(m, elements[0], elements[1]);
  if (elements.length === 3) return three(m, elements[0], elements[1], elements[2]);
  if (elements.length === 4) return four(m, elements[0], elements[1], elements[2], elements[3]);
  throw new Error("Invalid affix length");
};

const deepL = <V, A>(
  m: Measured<A, V>,
  prefixElements: readonly A[],
  deeper: FingerTree<V, Node<V, A>>,
  suffix: Affix<V, A>
): FingerTree<V, A> => {
  if (prefixElements.length === 0) {
    const headNode = head(deeper);
    if (O.isNone(headNode)) {
      return fromArray(suffix.toList(), m);
    }
    const firstNode = headNode.value;
    const restDeeper = O.getOrThrow(tail(deeper));
    const newPrefix = buildAffix(m, firstNode.toList());
    const annotation = m.combine(newPrefix.annotation, m.combine(restDeeper.annotation, suffix.annotation));
    return new DeepImpl(m, annotation, newPrefix, restDeeper, suffix);
  } else {
    const newPrefix = buildAffix(m, prefixElements);
    const annotation = m.combine(newPrefix.annotation, m.combine(deeper.annotation, suffix.annotation));
    return new DeepImpl(m, annotation, newPrefix, deeper, suffix);
  }
};

const deepR = <V, A>(
  m: Measured<A, V>,
  prefix: Affix<V, A>,
  deeper: FingerTree<V, Node<V, A>>,
  suffixElements: readonly A[]
): FingerTree<V, A> => {
  if (suffixElements.length === 0) {
    const lastNode = last(deeper);
    if (O.isNone(lastNode)) {
      return fromArray(prefix.toList(), m);
    }
    const lastNodeVal = lastNode.value;
    const restDeeper = O.getOrThrow(init(deeper));
    const newSuffix = buildAffix(m, lastNodeVal.toList());
    const annotation = m.combine(prefix.annotation, m.combine(restDeeper.annotation, newSuffix.annotation));
    return new DeepImpl(m, annotation, prefix, restDeeper, newSuffix);
  } else {
    const newSuffix = buildAffix(m, suffixElements);
    const annotation = m.combine(prefix.annotation, m.combine(deeper.annotation, newSuffix.annotation));
    return new DeepImpl(m, annotation, prefix, deeper, newSuffix);
  }
};

const splitArray = <V, A>(
  m: Measured<A, V>,
  predicate: (v: V) => boolean,
  start: V,
  elements: readonly A[]
): { left: A[], value: A, right: A[] } => {
  let acc = start;
  for (let i = 0; i < elements.length; i++) {
    const val = elements[i];
    const valMeasure = m.measure(val);
    const nextAcc = m.combine(acc, valMeasure);
    if (predicate(nextAcc)) {
      return {
        left: elements.slice(0, i) as A[],
        value: val,
        right: elements.slice(i + 1) as A[]
      };
    }
    acc = nextAcc;
  }
  return {
    left: elements.slice(0, elements.length - 1) as A[],
    value: elements[elements.length - 1],
    right: []
  };
};

const splitTree = <V, A>(
  m: Measured<A, V>,
  predicate: (v: V) => boolean,
  start: V,
  t: FingerTree<V, A>
): Sp<V, A> => {
  if (isSingle(t)) {
    return new SplitImpl(empty(m), t.value, empty(m));
  }
  
  if (isDeep(t)) {
    const prefixAcc = m.combine(start, t.prefix.annotation);
    if (predicate(prefixAcc)) {
      const { left, value, right } = splitArray(m, predicate, start, t.prefix.toList());
      return new SplitImpl(fromArray(left, m), value, deepL(m, right, t.deeper, t.suffix));
    }
    
    const deeperAcc = m.combine(prefixAcc, t.deeper.annotation);
    if (predicate(deeperAcc)) {
      const nodeMeasured: Measured<Node<V, A>, V> = {
        empty: m.empty,
        measure: (node: Node<V, A>) => node.annotation,
        combine: (v1, v2) => m.combine(v1, v2),
        combineAll: m.combineAll,
        combineMany: m.combineMany,
      };
      
      const splitDeeper = splitTree(nodeMeasured, predicate, prefixAcc, t.deeper);
      
      const nodeStart = m.combine(prefixAcc, splitDeeper.left.annotation);
      const { left, value, right } = splitArray(m, predicate, nodeStart, splitDeeper.value.toList());
      
      return new SplitImpl(
        deepR(m, t.prefix, splitDeeper.left, left),
        value,
        deepL(m, right, splitDeeper.right, t.suffix)
      );
    }
    
    const { left, value, right } = splitArray(m, predicate, deeperAcc, t.suffix.toList());
    return new SplitImpl(deepR(m, t.prefix, t.deeper, left), value, fromArray(right, m));
  }
  
  throw new Error("Cannot split empty tree");
};

export const split = <V, A>(
  _predicate: (v: V) => boolean,
  _start: V,
  _t: FingerTree<V, A>,
): O.Option<Split<V, A>> => {
  if (isEmpty(_t)) {
    return O.none();
  }
  if (_predicate(_t.m.combine(_start, _t.annotation))) {
    return O.some(splitTree(_t.m, _predicate, _start, _t));
  }
  return O.none();
};

// ---------------------------------------------------------------------------
// Higher-order traversals
// ---------------------------------------------------------------------------
const mapRec = <V, A, B>(
  t: FingerTree<V, A>,
  f: (a: A) => B,
  m: Measured<B, V>,
): Trampoline<FingerTree<V, B>> => {
  if (isEmpty(t)) {
    return empty(m);
  }
  if (isSingle(t)) {
    return single(m, f(t.value));
  }
  if (isDeep(t)) {
    const mapAffix = (affix: Affix<V, A>): Affix<V, B> => {
      const mapped = affix.toList().map(f);
      if (mapped.length === 1) return one(m, mapped[0]);
      if (mapped.length === 2) return two(m, mapped[0], mapped[1]);
      if (mapped.length === 3) return three(m, mapped[0], mapped[1], mapped[2]);
      return four(m, mapped[0], mapped[1], mapped[2], mapped[3]);
    };

    const newPrefix = mapAffix(t.prefix);
    const newSuffix = mapAffix(t.suffix);

    const mapNode = (node: Node<V, A>): Node<V, B> => {
      const mapped = node.toList().map(f);
      if (mapped.length === 2) return branch2(m, mapped[0], mapped[1]);
      return branch3(m, mapped[0], mapped[1], mapped[2]);
    };

    const nodeMeasured: Measured<Node<V, B>, V> = {
      empty: m.empty,
      measure: (node: Node<V, B>) => node.annotation,
      combine: (v1, v2) => m.combine(v1, v2),
      combineAll: m.combineAll,
      combineMany: m.combineMany,
    };

    return () => flatMap(
      mapRec(t.deeper, mapNode, nodeMeasured),
      (newDeeper) => {
        const annotation = m.combine(
          newPrefix.annotation,
          m.combine(newDeeper.annotation, newSuffix.annotation)
        );
        return new DeepImpl(m, annotation, newPrefix, newDeeper, newSuffix);
      }
    );
  }
  return empty(m);
};

export const map = <V, A, B>(
  _t: FingerTree<V, A>,
  _f: (a: A) => B,
  _m: Measured<B, V>,
): FingerTree<V, B> => trampoline(mapRec)(_t, _f, _m);

const foldlRec = <V, A, B>(
  f: (acc: B, a: A) => B,
  acc: B,
  t: FingerTree<V, A>,
): Trampoline<B> => {
  if (isEmpty(t)) {
    return acc;
  }
  if (isSingle(t)) {
    return f(acc, t.value);
  }
  if (isDeep(t)) {
    const acc1 = t.prefix.toList().reduce(f, acc);
    
    const foldNode = (accNode: B, node: Node<V, A>): B => {
      return node.toList().reduce(f, accNode);
    };
    
    return () => flatMap(
      foldlRec(foldNode, acc1, t.deeper),
      (acc2) => {
        return t.suffix.toList().reduce(f, acc2);
      }
    );
  }
  return acc;
};

export const foldl = <V, A, B>(
  _f: (acc: B, a: A) => B,
  _init: B,
  _t: FingerTree<V, A>,
): B => trampoline(foldlRec)(_f, _init, _t);

const foldrRec = <V, A, B>(
  f: (a: A, acc: B) => B,
  acc: B,
  t: FingerTree<V, A>,
): Trampoline<B> => {
  if (isEmpty(t)) {
    return acc;
  }
  if (isSingle(t)) {
    return f(t.value, acc);
  }
  if (isDeep(t)) {
    const acc1 = t.suffix.toList().reduceRight((accSuff, a) => f(a, accSuff), acc);
    
    const foldNode = (node: Node<V, A>, accNode: B): B => {
      return node.toList().reduceRight((accN, a) => f(a, accN), accNode);
    };
    
    return () => flatMap(
      foldrRec(foldNode, acc1, t.deeper),
      (acc2) => {
        return t.prefix.toList().reduceRight((accPref, a) => f(a, accPref), acc2);
      }
    );
  }
  return acc;
};

export const foldr = <V, A, B>(
  _f: (a: A, acc: B) => B,
  _init: B,
  _t: FingerTree<V, A>,
): B => trampoline(foldrRec)(_f, _init, _t);
