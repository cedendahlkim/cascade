# Task: gen-comb-permutations-9813 | Score: 100% | 2026-02-11T10:04:38.245125

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