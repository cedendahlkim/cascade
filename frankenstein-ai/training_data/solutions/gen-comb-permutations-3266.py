# Task: gen-comb-permutations-3266 | Score: 100% | 2026-02-11T11:24:06.188634

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