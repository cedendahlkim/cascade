# Task: gen-comb-permutations-2031 | Score: 100% | 2026-02-12T12:03:09.468142

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