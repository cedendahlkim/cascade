# Task: gen-comb-permutations-1183 | Score: 100% | 2026-02-12T21:07:15.805031

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