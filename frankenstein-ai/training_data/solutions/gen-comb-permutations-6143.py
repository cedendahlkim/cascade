# Task: gen-comb-permutations-6143 | Score: 100% | 2026-02-11T10:23:06.993535

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