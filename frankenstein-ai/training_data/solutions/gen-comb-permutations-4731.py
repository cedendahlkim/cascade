# Task: gen-comb-permutations-4731 | Score: 100% | 2026-02-11T10:39:44.982218

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