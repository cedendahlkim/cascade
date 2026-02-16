# Task: gen-comb-permutations-9474 | Score: 100% | 2026-02-11T09:17:34.620394

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