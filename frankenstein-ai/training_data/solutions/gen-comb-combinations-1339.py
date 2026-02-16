# Task: gen-comb-combinations-1339 | Score: 100% | 2026-02-10T17:48:23.007424

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