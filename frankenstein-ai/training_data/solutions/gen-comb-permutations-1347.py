# Task: gen-comb-permutations-1347 | Score: 100% | 2026-02-11T07:37:03.671155

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