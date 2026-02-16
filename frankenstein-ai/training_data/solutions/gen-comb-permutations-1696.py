# Task: gen-comb-permutations-1696 | Score: 100% | 2026-02-13T08:46:38.141396

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