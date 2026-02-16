# Task: gen-comb-permutations-3518 | Score: 100% | 2026-02-11T10:35:00.772630

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