# Task: gen-comb-permutations-7093 | Score: 100% | 2026-02-12T16:05:49.756728

import itertools

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(input())

    perms = list(itertools.permutations(nums))
    
    for perm in perms:
        print(*perm)

solve()