# Task: gen-comb-permutations-9401 | Score: 100% | 2026-02-12T12:02:51.670194

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