# Task: gen-comb-permutations-8822 | Score: 100% | 2026-02-12T17:22:07.093883

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