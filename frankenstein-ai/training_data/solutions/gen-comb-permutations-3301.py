# Task: gen-comb-permutations-3301 | Score: 100% | 2026-02-11T10:00:11.194982

import itertools

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(int(input()))
    
    permutations = list(itertools.permutations(nums))
    
    for perm in sorted(permutations):
        print(*perm)

solve()