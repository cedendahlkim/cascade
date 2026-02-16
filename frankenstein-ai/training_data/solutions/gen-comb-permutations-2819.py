# Task: gen-comb-permutations-2819 | Score: 100% | 2026-02-12T14:19:52.261235

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