# Task: gen-comb-combinations-1560 | Score: 100% | 2026-02-11T09:42:36.746583

import itertools

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(int(input()))
    k = int(input())

    combinations = list(itertools.combinations(nums, k))

    for comb in combinations:
        print(*comb)

solve()