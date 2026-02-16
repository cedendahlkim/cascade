# Task: gen-comb-permutations-3872 | Score: 100% | 2026-02-11T11:48:18.327734

import itertools

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(int(input()))
    
    perms = list(itertools.permutations(nums))
    
    for perm in perms:
        print(*perm)

solve()