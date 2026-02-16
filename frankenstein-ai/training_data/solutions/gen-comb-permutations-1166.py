# Task: gen-comb-permutations-1166 | Score: 100% | 2026-02-11T12:03:17.200663

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