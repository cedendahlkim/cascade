# Task: gen-comb-combinations-7685 | Score: 100% | 2026-02-11T07:47:28.525833

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