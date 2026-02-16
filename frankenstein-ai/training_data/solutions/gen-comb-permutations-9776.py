# Task: gen-comb-permutations-9776 | Score: 100% | 2026-02-12T14:58:08.117352

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