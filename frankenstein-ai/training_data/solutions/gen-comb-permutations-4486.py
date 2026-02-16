# Task: gen-comb-permutations-4486 | Score: 100% | 2026-02-12T21:15:53.899850

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