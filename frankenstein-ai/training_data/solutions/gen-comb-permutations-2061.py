# Task: gen-comb-permutations-2061 | Score: 100% | 2026-02-12T18:56:40.899622

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