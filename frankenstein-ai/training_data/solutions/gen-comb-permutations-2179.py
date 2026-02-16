# Task: gen-comb-permutations-2179 | Score: 100% | 2026-02-10T18:15:38.766569

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