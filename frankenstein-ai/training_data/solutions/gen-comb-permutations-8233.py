# Task: gen-comb-permutations-8233 | Score: 100% | 2026-02-11T11:40:43.340588

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