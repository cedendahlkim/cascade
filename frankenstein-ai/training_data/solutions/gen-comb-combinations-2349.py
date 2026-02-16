# Task: gen-comb-combinations-2349 | Score: 100% | 2026-02-11T09:53:45.665314

import itertools

def solve():
    n = int(input())
    elements = []
    for _ in range(n):
        elements.append(int(input()))
    k = int(input())

    for combination in itertools.combinations(elements, k):
        print(*combination)

solve()