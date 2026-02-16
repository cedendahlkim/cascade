# Task: gen-comb-permutations-5005 | Score: 100% | 2026-02-11T11:52:10.031279

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