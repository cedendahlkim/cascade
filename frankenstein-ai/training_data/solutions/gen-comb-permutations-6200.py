# Task: gen-comb-permutations-6200 | Score: 100% | 2026-02-11T11:46:52.143638

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