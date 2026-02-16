# Task: gen-comb-permutations-3526 | Score: 100% | 2026-02-11T10:36:36.550406

import itertools

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(int(input()))
    
    perms = list(itertools.permutations(nums))
    
    for perm in sorted(perms):
        print(*perm)

solve()