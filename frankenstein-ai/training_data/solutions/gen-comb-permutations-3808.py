# Task: gen-comb-permutations-3808 | Score: 100% | 2026-02-11T11:19:50.046686

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