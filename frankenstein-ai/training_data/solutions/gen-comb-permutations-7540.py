# Task: gen-comb-permutations-7540 | Score: 100% | 2026-02-10T18:53:51.623767

import itertools

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(input())

    permutations = list(itertools.permutations(nums))
    permutations.sort()

    for perm in permutations:
        print(*perm)

solve()