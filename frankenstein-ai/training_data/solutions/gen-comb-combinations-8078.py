# Task: gen-comb-combinations-8078 | Score: 100% | 2026-02-11T11:11:09.920388

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