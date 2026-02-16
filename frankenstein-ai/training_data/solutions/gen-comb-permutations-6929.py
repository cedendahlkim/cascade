# Task: gen-comb-permutations-6929 | Score: 100% | 2026-02-11T11:13:10.158787

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