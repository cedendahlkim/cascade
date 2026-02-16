# Task: gen-comb-permutations-7415 | Score: 100% | 2026-02-11T11:23:56.565078

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