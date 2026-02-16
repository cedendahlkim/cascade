# Task: gen-comb-permutations-4580 | Score: 100% | 2026-02-11T11:14:53.094908

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