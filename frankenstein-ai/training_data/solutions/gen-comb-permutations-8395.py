# Task: gen-comb-permutations-8395 | Score: 100% | 2026-02-11T08:53:25.405892

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