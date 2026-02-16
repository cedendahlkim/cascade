# Task: gen-comb-permutations-8761 | Score: 100% | 2026-02-11T12:03:36.840974

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