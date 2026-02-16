# Task: gen-comb-permutations-2538 | Score: 100% | 2026-02-11T12:03:22.998012

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