# Task: gen-comb-permutations-9047 | Score: 100% | 2026-02-11T12:04:06.536270

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