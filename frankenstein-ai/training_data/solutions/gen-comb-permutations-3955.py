# Task: gen-comb-permutations-3955 | Score: 100% | 2026-02-11T11:21:00.955175

import itertools

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(int(input()))
    
    permutations = list(itertools.permutations(nums))
    
    for perm in permutations:
        print(*perm)

solve()