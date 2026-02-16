# Task: gen-comb-permutations-8095 | Score: 100% | 2026-02-11T11:22:54.141992

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