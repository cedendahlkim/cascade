# Task: gen-comb-permutations-2241 | Score: 100% | 2026-02-10T18:46:33.225194

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