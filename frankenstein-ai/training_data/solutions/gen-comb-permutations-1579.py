# Task: gen-comb-permutations-1579 | Score: 100% | 2026-02-11T11:05:03.124287

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