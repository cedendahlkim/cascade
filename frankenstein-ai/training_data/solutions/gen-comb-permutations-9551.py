# Task: gen-comb-permutations-9551 | Score: 100% | 2026-02-13T08:56:37.059049

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