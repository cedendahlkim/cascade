# Task: gen-comb-permutations-2038 | Score: 100% | 2026-02-11T09:52:42.569288

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