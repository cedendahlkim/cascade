# Task: gen-comb-permutations-4634 | Score: 100% | 2026-02-10T17:52:26.798027

import itertools

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(input())

    perms = list(itertools.permutations(nums))
    perms.sort()

    for perm in perms:
        print(*perm)

solve()