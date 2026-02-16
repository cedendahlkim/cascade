# Task: gen-comb-permutations-7116 | Score: 100% | 2026-02-11T08:41:56.300409

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