# Task: gen-comb-permutations-7374 | Score: 100% | 2026-02-11T09:32:19.166392

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