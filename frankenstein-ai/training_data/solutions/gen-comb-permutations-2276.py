# Task: gen-comb-permutations-2276 | Score: 100% | 2026-02-12T19:59:39.442540

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