# Task: gen-comb-permutations-8658 | Score: 100% | 2026-02-11T09:00:41.743735

import itertools

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(int(input()))

    permutations = list(itertools.permutations(nums))
    permutations.sort()

    for perm in permutations:
        print(*perm)

solve()