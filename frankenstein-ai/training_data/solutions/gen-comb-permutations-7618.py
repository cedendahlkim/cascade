# Task: gen-comb-permutations-7618 | Score: 100% | 2026-02-11T09:56:27.828291

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