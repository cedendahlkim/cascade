# Task: gen-comb-combinations-5710 | Score: 100% | 2026-02-10T17:44:12.253702

import itertools

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(int(input()))
    k = int(input())

    for comb in itertools.combinations(nums, k):
        print(*comb)

solve()