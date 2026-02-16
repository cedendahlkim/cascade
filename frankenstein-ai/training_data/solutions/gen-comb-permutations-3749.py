# Task: gen-comb-permutations-3749 | Score: 100% | 2026-02-10T18:15:36.078927

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