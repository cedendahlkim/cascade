# Task: gen-comb-combinations-1555 | Score: 100% | 2026-02-11T11:35:49.042332

import itertools

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(int(input()))
    k = int(input())

    combinations = list(itertools.combinations(nums, k))

    for combo in combinations:
        print(*combo)

solve()