# Task: gen-comb-permutations-8548 | Score: 100% | 2026-02-10T17:43:29.047116

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