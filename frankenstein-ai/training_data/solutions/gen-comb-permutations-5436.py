# Task: gen-comb-permutations-5436 | Score: 100% | 2026-02-11T08:41:09.094228

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