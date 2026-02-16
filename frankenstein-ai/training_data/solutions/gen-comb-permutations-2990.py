# Task: gen-comb-permutations-2990 | Score: 100% | 2026-02-11T12:11:47.732603

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