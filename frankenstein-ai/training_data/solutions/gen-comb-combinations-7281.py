# Task: gen-comb-combinations-7281 | Score: 100% | 2026-02-10T17:54:44.460713

import itertools

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(int(input()))
    k = int(input())

    for combo in itertools.combinations(nums, k):
        print(*combo)

solve()