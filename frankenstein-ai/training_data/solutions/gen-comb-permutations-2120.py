# Task: gen-comb-permutations-2120 | Score: 100% | 2026-02-11T11:54:04.794443

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