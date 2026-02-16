# Task: gen-comb-permutations-3068 | Score: 100% | 2026-02-12T15:19:18.193238

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