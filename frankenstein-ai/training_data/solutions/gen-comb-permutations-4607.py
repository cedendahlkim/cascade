# Task: gen-comb-permutations-4607 | Score: 100% | 2026-02-11T11:11:26.368153

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