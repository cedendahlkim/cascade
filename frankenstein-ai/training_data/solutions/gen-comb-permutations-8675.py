# Task: gen-comb-permutations-8675 | Score: 100% | 2026-02-11T09:21:03.331554

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