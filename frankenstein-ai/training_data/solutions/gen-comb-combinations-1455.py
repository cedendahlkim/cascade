# Task: gen-comb-combinations-1455 | Score: 100% | 2026-02-11T10:51:16.011347

from itertools import combinations

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(int(input()))
    k = int(input())

    for combo in combinations(nums, k):
        print(*combo)

solve()