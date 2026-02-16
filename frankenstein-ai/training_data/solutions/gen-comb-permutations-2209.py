# Task: gen-comb-permutations-2209 | Score: 100% | 2026-02-10T18:10:41.653532

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