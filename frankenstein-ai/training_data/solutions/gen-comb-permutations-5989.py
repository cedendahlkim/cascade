# Task: gen-comb-permutations-5989 | Score: 100% | 2026-02-10T17:42:02.416621

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