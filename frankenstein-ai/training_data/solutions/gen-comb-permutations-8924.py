# Task: gen-comb-permutations-8924 | Score: 100% | 2026-02-13T08:39:32.989068

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