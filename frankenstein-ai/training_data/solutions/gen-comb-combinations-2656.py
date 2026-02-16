# Task: gen-comb-combinations-2656 | Score: 100% | 2026-02-11T11:50:41.025449

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