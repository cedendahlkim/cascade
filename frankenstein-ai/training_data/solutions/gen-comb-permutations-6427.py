# Task: gen-comb-permutations-6427 | Score: 100% | 2026-02-11T12:11:08.135233

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