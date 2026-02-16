# Task: gen-comb-permutations-1777 | Score: 100% | 2026-02-12T12:38:44.682554

import itertools

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(int(input()))
    
    permutations = list(itertools.permutations(nums))
    permutations.sort()
    
    for perm in permutations:
        print(*perm)

solve()