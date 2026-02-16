# Task: gen-comb-permutations-4933 | Score: 100% | 2026-02-10T17:57:30.302558

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