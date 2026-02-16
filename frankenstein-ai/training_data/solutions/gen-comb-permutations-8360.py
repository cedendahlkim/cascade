# Task: gen-comb-permutations-8360 | Score: 100% | 2026-02-10T18:09:18.880792

import itertools

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(int(input()))

    permutations = list(itertools.permutations(nums))

    for perm in permutations:
        print(*perm)

solve()