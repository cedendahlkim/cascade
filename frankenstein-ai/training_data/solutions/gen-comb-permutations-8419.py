# Task: gen-comb-permutations-8419 | Score: 100% | 2026-02-11T11:41:18.354041

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