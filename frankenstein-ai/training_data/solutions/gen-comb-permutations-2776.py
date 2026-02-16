# Task: gen-comb-permutations-2776 | Score: 100% | 2026-02-11T08:41:58.406122

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