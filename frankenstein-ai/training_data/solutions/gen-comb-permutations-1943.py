# Task: gen-comb-permutations-1943 | Score: 100% | 2026-02-11T10:18:23.335891

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