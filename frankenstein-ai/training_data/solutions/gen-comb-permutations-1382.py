# Task: gen-comb-permutations-1382 | Score: 100% | 2026-02-11T12:10:33.146385

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