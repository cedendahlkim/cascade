# Task: gen-comb-permutations-5353 | Score: 100% | 2026-02-11T11:28:00.330188

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