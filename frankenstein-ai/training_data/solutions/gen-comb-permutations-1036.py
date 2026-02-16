# Task: gen-comb-permutations-1036 | Score: 100% | 2026-02-11T10:21:34.856527

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