# Task: gen-comb-permutations-5379 | Score: 100% | 2026-02-12T19:31:18.084017

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