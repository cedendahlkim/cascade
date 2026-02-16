# Task: gen-comb-permutations-3239 | Score: 100% | 2026-02-12T21:13:09.023799

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