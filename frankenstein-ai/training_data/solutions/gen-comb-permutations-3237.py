# Task: gen-comb-permutations-3237 | Score: 100% | 2026-02-11T09:23:01.553463

import itertools

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(int(input()))
    
    permutations = list(itertools.permutations(nums))
    
    for perm in permutations:
        print(*perm)

solve()