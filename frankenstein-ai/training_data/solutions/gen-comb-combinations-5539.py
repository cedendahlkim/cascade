# Task: gen-comb-combinations-5539 | Score: 100% | 2026-02-11T09:52:13.089629

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