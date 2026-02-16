# Task: gen-comb-permutations-1973 | Score: 100% | 2026-02-10T18:14:14.276511

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