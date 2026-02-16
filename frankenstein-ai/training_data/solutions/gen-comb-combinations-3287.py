# Task: gen-comb-combinations-3287 | Score: 100% | 2026-02-11T09:52:47.409816

import itertools

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(int(input()))
    k = int(input())
    
    combinations = itertools.combinations(nums, k)
    
    for combination in combinations:
        print(*combination)

solve()