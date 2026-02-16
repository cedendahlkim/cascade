# Task: gen-comb-permutations-5752 | Score: 100% | 2026-02-11T10:46:54.317214

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