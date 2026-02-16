# Task: gen-comb-permutations-7787 | Score: 100% | 2026-02-11T09:56:12.800658

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