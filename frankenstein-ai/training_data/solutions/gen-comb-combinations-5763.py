# Task: gen-comb-combinations-5763 | Score: 100% | 2026-02-10T18:08:00.347552

import itertools

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(int(input()))
    k = int(input())

    combinations = itertools.combinations(nums, k)
    for comb in combinations:
        print(*comb)

solve()