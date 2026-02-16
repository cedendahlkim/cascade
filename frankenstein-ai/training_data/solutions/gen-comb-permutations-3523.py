# Task: gen-comb-permutations-3523 | Score: 100% | 2026-02-11T10:33:19.992342

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