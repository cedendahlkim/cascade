# Task: gen-comb-permutations-9810 | Score: 100% | 2026-02-11T09:02:16.753422

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