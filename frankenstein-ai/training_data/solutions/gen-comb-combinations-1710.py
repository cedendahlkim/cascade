# Task: gen-comb-combinations-1710 | Score: 100% | 2026-02-10T18:10:17.570675

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