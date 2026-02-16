# Task: gen-comb-permutations-9223 | Score: 100% | 2026-02-11T10:11:37.785210

import itertools

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(int(input()))
    
    perms = list(itertools.permutations(nums))
    perms.sort()
    
    for perm in perms:
        print(*perm)

solve()