# Task: gen-comb-permutations-2642 | Score: 100% | 2026-02-11T09:15:57.629586

import itertools

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(int(input()))
    
    perms = list(itertools.permutations(nums))
    perms.sort()
    
    for perm in perms:
        print(*perm)

solve()