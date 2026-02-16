# Task: gen-comb-permutations-5339 | Score: 100% | 2026-02-10T18:00:28.979313

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