# Task: gen-comb-permutations-9561 | Score: 100% | 2026-02-11T11:49:57.688395

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