# Task: gen-comb-permutations-1642 | Score: 100% | 2026-02-11T11:55:30.578140

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