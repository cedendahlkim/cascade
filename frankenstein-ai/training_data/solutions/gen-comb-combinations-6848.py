# Task: gen-comb-combinations-6848 | Score: 100% | 2026-02-10T18:04:36.174992

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