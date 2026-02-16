# Task: gen-comb-permutations-3431 | Score: 100% | 2026-02-11T07:45:11.189124

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