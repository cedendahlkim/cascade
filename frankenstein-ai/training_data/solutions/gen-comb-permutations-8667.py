# Task: gen-comb-permutations-8667 | Score: 100% | 2026-02-11T11:21:45.147709

import itertools

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(input())

    perms = list(itertools.permutations(nums))
    perms.sort()

    for perm in perms:
        print(*perm)

solve()