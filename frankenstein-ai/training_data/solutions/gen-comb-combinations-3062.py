# Task: gen-comb-combinations-3062 | Score: 100% | 2026-02-10T18:36:23.710551

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