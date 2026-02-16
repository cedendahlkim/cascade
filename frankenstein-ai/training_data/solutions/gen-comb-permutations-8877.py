# Task: gen-comb-permutations-8877 | Score: 100% | 2026-02-11T11:49:15.876102

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