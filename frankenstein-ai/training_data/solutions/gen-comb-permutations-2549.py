# Task: gen-comb-permutations-2549 | Score: 100% | 2026-02-11T09:34:45.900054

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