# Task: gen-comb-permutations-3578 | Score: 100% | 2026-02-10T19:05:47.351491

import itertools

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(input())

    perms = list(itertools.permutations(nums))
    
    for perm in perms:
        print(*perm)

solve()