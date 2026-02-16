# Task: gen-comb-permutations-5082 | Score: 100% | 2026-02-11T11:37:52.484367

import itertools

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(input())

    perms = list(itertools.permutations(nums))
    
    for perm in perms:
        print(*perm)

solve()