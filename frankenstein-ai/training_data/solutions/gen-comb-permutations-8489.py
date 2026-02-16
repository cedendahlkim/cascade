# Task: gen-comb-permutations-8489 | Score: 100% | 2026-02-11T09:40:53.884696

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