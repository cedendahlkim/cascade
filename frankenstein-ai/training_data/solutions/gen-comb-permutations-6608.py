# Task: gen-comb-permutations-6608 | Score: 100% | 2026-02-11T10:54:11.976102

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