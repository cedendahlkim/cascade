# Task: gen-comb-permutations-9870 | Score: 100% | 2026-02-11T07:28:48.890552

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