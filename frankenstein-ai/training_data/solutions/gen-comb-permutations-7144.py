# Task: gen-comb-permutations-7144 | Score: 100% | 2026-02-12T15:17:36.984376

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