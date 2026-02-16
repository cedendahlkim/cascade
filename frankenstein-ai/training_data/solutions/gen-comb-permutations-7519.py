# Task: gen-comb-permutations-7519 | Score: 100% | 2026-02-13T08:49:10.202618

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