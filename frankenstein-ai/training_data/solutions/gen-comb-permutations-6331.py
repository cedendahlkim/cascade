# Task: gen-comb-permutations-6331 | Score: 100% | 2026-02-11T08:58:03.179247

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