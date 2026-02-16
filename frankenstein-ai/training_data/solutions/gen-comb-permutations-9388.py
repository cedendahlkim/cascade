# Task: gen-comb-permutations-9388 | Score: 100% | 2026-02-10T18:30:55.048685

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