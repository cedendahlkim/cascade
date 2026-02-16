# Task: gen-comb-permutations-9464 | Score: 100% | 2026-02-11T10:40:53.770137

import itertools

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(int(input()))
    
    permutations = list(itertools.permutations(nums))
    permutations.sort()
    
    for perm in permutations:
        print(*perm)

solve()