# Task: gen-comb-permutations-3234 | Score: 100% | 2026-02-11T09:34:31.601871

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