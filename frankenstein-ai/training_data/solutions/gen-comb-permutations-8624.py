# Task: gen-comb-permutations-8624 | Score: 100% | 2026-02-10T19:10:42.003738

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