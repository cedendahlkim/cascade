# Task: gen-comb-permutations-4962 | Score: 100% | 2026-02-11T11:00:49.246173

import itertools

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(int(input()))
    
    perms = list(itertools.permutations(nums))
    
    for perm in perms:
        print(*perm)

solve()