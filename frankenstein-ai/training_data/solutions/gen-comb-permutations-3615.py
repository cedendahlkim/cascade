# Task: gen-comb-permutations-3615 | Score: 100% | 2026-02-12T20:01:35.700164

import itertools

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(int(input()))
    
    permutations = list(itertools.permutations(nums))
    permutations.sort()
    
    for perm in permutations:
        print(*perm)

solve()