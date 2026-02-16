# Task: gen-comb-permutations-1762 | Score: 100% | 2026-02-11T09:18:26.396373

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