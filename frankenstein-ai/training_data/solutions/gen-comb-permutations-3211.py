# Task: gen-comb-permutations-3211 | Score: 100% | 2026-02-11T11:28:01.912927

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