# Task: gen-comb-permutations-5724 | Score: 100% | 2026-02-11T09:31:21.229546

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