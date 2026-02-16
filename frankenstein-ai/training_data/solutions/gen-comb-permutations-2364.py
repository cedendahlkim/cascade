# Task: gen-comb-permutations-2364 | Score: 100% | 2026-02-12T12:55:02.588082

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