# Task: gen-comb-permutations-4662 | Score: 100% | 2026-02-11T09:04:44.128943

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