# Task: gen-comb-permutations-2962 | Score: 100% | 2026-02-11T07:38:10.949869

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