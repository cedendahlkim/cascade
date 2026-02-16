# Task: gen-comb-permutations-5192 | Score: 100% | 2026-02-10T17:55:58.427750

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