# Task: gen-comb-permutations-6097 | Score: 100% | 2026-02-11T12:04:45.606700

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