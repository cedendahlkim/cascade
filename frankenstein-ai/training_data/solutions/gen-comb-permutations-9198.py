# Task: gen-comb-permutations-9198 | Score: 100% | 2026-02-11T12:05:36.154375

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