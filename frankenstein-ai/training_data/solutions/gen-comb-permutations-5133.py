# Task: gen-comb-permutations-5133 | Score: 100% | 2026-02-11T09:19:21.601902

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