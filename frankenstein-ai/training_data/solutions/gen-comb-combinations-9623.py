# Task: gen-comb-combinations-9623 | Score: 100% | 2026-02-10T18:40:46.245210

from itertools import combinations

def solve():
    n = int(input())
    elements = []
    for _ in range(n):
        elements.append(int(input()))
    k = int(input())

    for combination in combinations(elements, k):
        print(*combination)

solve()