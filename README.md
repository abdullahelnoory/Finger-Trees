# Internship Applicant Task — Persistent Priority Queue on a Finger Tree

> **👉 The full brief is in [`TASK.md`](./TASK.md). Start there.**

## Quick start

```bash
# Set up the dev shell (provides Deno, Node, formatters, etc.)
direnv allow                       # if you use direnv
# or:
devenv shell                       # if you use devenv directly
# or just install Deno >= 2.7 yourself.

# Install / resolve dependencies (auto-managed by Deno's nodeModulesDir).
deno install

# Run the (kept) FingerTree spec — should fail, every assertion routed
# through the `NotImplementedError` stubs in src/fingerTree/FingerTree.ts.
deno task test

# Run the FingerTree benchmarks — sanity-check that your `deno bench`
# wiring works before you touch the code.
deno task benchmark:fingerTree
```

When you implement `src/fingerTree/FingerTree.ts`, the kept tests in
`src/fingerTree/FingerTree.test.ts` will start passing one by one. That's the
loop.

## Layout

```
.
├── TASK.md                            # ← read this first
├── deno.json                          # tasks + import map
├── vitest.config.ts                   # mirrors the import map for vitest
├── src/
│   ├── index.ts                       # public entrypoint (do not change)
│   ├── fingerTree/
│   │   ├── FingerTree.ts              # 👉 you implement
│   │   ├── FingerTree.test.ts         # spec (do not modify)
│   │   └── FingerTree.bench.ts        # spec (do not modify)
│   ├── fingerPriorityQueue/
│   │   ├── FingerPriorityQueue.ts     # 👉 you implement
│   │   ├── FingerPriorityQueue.test.ts# 👉 you write
│   │   └── FingerPriorityQueue.bench.ts # 👉 you write
│   ├── internal/                      # reference reading — read, do not copy
│   └── utils/                         # importable helpers (`@monoids`, `@trampoline`)
└── .github/
    ├── workflows/ci.yml               # the gates your PR must pass
    └── PULL_REQUEST_TEMPLATE.md       # self-score template
```

## What we judge

See `TASK.md` §9. Tl;dr: correctness 25 · code quality 20 · tests 15 ·
benchmarks 10 · design write-up 15 · idiomatic Effect/monoid/trampoline use 10 ·
engineering hygiene 5 = **100**.

## Tasks

| Task                     | Command                                   |
| ------------------------ | ----------------------------------------- |
| Run tests                | `deno task test`                          |
| Run tests with coverage  | `deno task coverage`                      |
| Bench the finger tree    | `deno task benchmark:fingerTree`          |
| Bench the priority queue | `deno task benchmark:fingerPriorityQueue` |
| Format                   | `deno fmt`                                |
| Lint                     | `deno lint`                               |

Have fun. Read the paper.
