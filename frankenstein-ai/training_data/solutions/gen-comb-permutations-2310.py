# Task: gen-comb-permutations-2310 | Score: 100% | 2026-02-12T12:08:56.499760

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