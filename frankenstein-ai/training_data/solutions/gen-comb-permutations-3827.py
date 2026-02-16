# Task: gen-comb-permutations-3827 | Score: 100% | 2026-02-12T21:13:19.528276

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