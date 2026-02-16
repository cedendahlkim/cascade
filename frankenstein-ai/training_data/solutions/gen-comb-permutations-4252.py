# Task: gen-comb-permutations-4252 | Score: 100% | 2026-02-13T08:38:57.629987

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