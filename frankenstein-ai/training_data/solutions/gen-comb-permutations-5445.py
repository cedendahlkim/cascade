# Task: gen-comb-permutations-5445 | Score: 100% | 2026-02-11T10:50:23.565249

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