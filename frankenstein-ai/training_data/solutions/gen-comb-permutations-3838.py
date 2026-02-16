# Task: gen-comb-permutations-3838 | Score: 100% | 2026-02-12T12:26:26.552478

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