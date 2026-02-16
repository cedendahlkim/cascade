# Task: gen-comb-permutations-9832 | Score: 100% | 2026-02-11T11:12:32.522455

import itertools

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(int(input()))

    for permutation in itertools.permutations(nums):
        print(*permutation)

solve()