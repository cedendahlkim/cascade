# Task: gen-comb-permutations-3562 | Score: 100% | 2026-02-12T13:33:12.846641

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