# Task: gen-comb-permutations-1276 | Score: 100% | 2026-02-12T17:19:29.224194

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