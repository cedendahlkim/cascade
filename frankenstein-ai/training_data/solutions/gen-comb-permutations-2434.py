# Task: gen-comb-permutations-2434 | Score: 100% | 2026-02-11T11:07:51.210753

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