# Task: gen-comb-combinations-2833 | Score: 100% | 2026-02-10T18:58:48.440092

import itertools

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(int(input()))
    k = int(input())

    combinations = list(itertools.combinations(nums, k))

    for combination in combinations:
        print(*combination)

solve()