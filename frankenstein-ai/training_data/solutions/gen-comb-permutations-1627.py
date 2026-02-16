# Task: gen-comb-permutations-1627 | Score: 100% | 2026-02-11T10:27:48.147408

import itertools

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(int(input()))

    perms = list(itertools.permutations(nums))

    for perm in perms:
        print(*perm)

solve()