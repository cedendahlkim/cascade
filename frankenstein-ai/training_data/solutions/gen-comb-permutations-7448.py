# Task: gen-comb-permutations-7448 | Score: 100% | 2026-02-11T10:03:02.877970

import itertools

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(int(input()))
    
    perms = list(itertools.permutations(nums))
    
    for perm in sorted(perms):
        print(*perm)

solve()