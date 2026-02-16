# Task: gen-comb-combinations-4263 | Score: 100% | 2026-02-10T18:14:43.095512

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