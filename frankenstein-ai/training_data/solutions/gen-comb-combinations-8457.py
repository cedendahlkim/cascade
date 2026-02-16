# Task: gen-comb-combinations-8457 | Score: 100% | 2026-02-12T15:00:56.607444

import itertools

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(int(input()))
    k = int(input())

    for combination in itertools.combinations(nums, k):
        print(*combination)

solve()