# Task: gen-comb-permutations-6543 | Score: 100% | 2026-02-11T10:17:48.610036

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