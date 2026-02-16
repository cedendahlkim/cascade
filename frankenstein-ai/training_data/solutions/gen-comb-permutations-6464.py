# Task: gen-comb-permutations-6464 | Score: 100% | 2026-02-11T07:34:35.577179

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