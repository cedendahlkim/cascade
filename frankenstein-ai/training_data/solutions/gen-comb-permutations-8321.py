# Task: gen-comb-permutations-8321 | Score: 100% | 2026-02-11T07:35:33.238703

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