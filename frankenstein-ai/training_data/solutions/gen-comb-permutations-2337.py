# Task: gen-comb-permutations-2337 | Score: 100% | 2026-02-10T17:49:39.907045

import itertools

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(int(input()))

    perms = list(itertools.permutations(nums))
    perms.sort()

    for perm in perms:
        print(*perm)

solve()