# Task: gen-comb-permutations-2198 | Score: 100% | 2026-02-11T10:32:29.972139

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