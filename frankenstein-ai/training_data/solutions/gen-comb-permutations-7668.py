# Task: gen-comb-permutations-7668 | Score: 100% | 2026-02-11T09:44:57.604846

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