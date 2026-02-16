# Task: gen-comb-combinations-7605 | Score: 100% | 2026-02-11T10:30:45.217197

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