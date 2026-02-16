# Task: gen-comb-permutations-7611 | Score: 100% | 2026-02-12T19:53:30.812042

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