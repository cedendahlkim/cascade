# Task: gen-comb-combinations-8138 | Score: 100% | 2026-02-11T10:49:58.694190

import itertools

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(int(input()))
    k = int(input())

    combinations = list(itertools.combinations(nums, k))

    for combo in combinations:
        print(*combo)

solve()