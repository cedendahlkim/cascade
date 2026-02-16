# Task: gen-comb-permutations-5403 | Score: 100% | 2026-02-11T11:44:11.683262

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