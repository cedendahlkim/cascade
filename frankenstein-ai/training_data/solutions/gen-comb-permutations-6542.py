# Task: gen-comb-permutations-6542 | Score: 100% | 2026-02-10T18:05:01.469014

import itertools

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(int(input()))
    
    perms = list(itertools.permutations(nums))
    
    for perm in sorted(perms):
        print(*perm)

solve()