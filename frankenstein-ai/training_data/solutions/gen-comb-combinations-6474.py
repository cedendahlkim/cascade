# Task: gen-comb-combinations-6474 | Score: 100% | 2026-02-11T08:58:58.661607

import itertools

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(int(input()))
    k = int(input())
    
    combinations = itertools.combinations(nums, k)
    
    for combo in combinations:
        print(*combo)

solve()