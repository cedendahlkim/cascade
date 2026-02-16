# Task: gen-comb-combinations-1511 | Score: 100% | 2026-02-11T10:03:26.160322

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