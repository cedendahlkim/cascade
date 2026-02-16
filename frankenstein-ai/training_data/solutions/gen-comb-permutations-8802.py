# Task: gen-comb-permutations-8802 | Score: 100% | 2026-02-10T18:06:56.672283

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