# Task: gen-comb-permutations-8213 | Score: 100% | 2026-02-12T16:21:44.961863

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