# Task: gen-comb-permutations-6373 | Score: 100% | 2026-02-11T10:35:30.071467

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