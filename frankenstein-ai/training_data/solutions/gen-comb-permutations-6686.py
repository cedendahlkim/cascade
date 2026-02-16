# Task: gen-comb-permutations-6686 | Score: 100% | 2026-02-11T09:58:02.212412

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