# Task: gen-comb-permutations-8313 | Score: 100% | 2026-02-11T09:31:28.063311

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