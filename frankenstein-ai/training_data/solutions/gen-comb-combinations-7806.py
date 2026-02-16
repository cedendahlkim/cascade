# Task: gen-comb-combinations-7806 | Score: 100% | 2026-02-11T07:26:48.403226

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