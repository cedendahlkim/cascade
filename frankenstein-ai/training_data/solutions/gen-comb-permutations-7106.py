# Task: gen-comb-permutations-7106 | Score: 100% | 2026-02-11T11:15:47.611371

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