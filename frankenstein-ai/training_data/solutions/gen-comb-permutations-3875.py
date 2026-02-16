# Task: gen-comb-permutations-3875 | Score: 100% | 2026-02-10T17:46:04.263618

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