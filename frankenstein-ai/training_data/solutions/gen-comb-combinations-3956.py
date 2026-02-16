# Task: gen-comb-combinations-3956 | Score: 100% | 2026-02-11T10:18:56.775687

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