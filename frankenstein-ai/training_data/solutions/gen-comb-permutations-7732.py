# Task: gen-comb-permutations-7732 | Score: 100% | 2026-02-11T10:50:25.563526

import itertools

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(int(input()))
    
    permutations = list(itertools.permutations(nums))
    
    for perm in sorted(permutations):
        print(*perm)

solve()