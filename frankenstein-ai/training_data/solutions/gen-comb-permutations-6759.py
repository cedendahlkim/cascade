# Task: gen-comb-permutations-6759 | Score: 100% | 2026-02-11T11:47:17.754877

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