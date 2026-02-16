# Task: gen-comb-permutations-1055 | Score: 100% | 2026-02-11T09:07:51.959438

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