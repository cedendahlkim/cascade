# Task: gen-comb-permutations-4212 | Score: 100% | 2026-02-12T19:48:30.554788

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