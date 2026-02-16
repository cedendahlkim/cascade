# Task: gen-comb-permutations-1543 | Score: 100% | 2026-02-10T17:44:51.173363

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