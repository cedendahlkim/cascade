# Task: gen-comb-permutations-4771 | Score: 100% | 2026-02-11T10:37:16.468158

import itertools

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(input())

    permutations = list(itertools.permutations(nums))
    
    for perm in permutations:
        print(*perm)

solve()