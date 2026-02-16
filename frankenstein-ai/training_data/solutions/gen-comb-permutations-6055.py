# Task: gen-comb-permutations-6055 | Score: 100% | 2026-02-12T20:17:58.814423

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