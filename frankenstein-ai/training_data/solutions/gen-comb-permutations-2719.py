# Task: gen-comb-permutations-2719 | Score: 100% | 2026-02-11T11:35:43.925955

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