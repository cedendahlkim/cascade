# Task: gen-comb-permutations-5163 | Score: 100% | 2026-02-11T10:49:51.830738

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