# Task: gen-comb-permutations-3806 | Score: 100% | 2026-02-11T12:08:41.757001

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