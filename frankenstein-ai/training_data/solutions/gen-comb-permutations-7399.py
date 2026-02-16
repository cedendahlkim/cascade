# Task: gen-comb-permutations-7399 | Score: 100% | 2026-02-11T12:00:10.542699

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