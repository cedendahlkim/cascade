# Task: gen-comb-permutations-3181 | Score: 100% | 2026-02-12T12:23:07.863784

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