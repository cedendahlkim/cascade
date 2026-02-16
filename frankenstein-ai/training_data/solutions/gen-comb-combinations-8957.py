# Task: gen-comb-combinations-8957 | Score: 100% | 2026-02-10T18:12:41.851995

import itertools

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(int(input()))
    k = int(input())

    combs = list(itertools.combinations(nums, k))

    for comb in combs:
        print(*comb)

solve()