# Task: gen-comb-combinations-5953 | Score: 100% | 2026-02-11T09:16:35.098059

from itertools import combinations

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(int(input()))
    k = int(input())

    for comb in combinations(nums, k):
        print(*comb)

solve()