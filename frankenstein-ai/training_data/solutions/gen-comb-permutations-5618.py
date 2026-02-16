# Task: gen-comb-permutations-5618 | Score: 100% | 2026-02-12T13:51:58.989145

import itertools

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(int(input()))
    
    perms = list(itertools.permutations(nums))
    
    for perm in perms:
        print(*perm)

solve()