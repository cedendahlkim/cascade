# Task: gen-comb-subsets-2760 | Score: 100% | 2026-02-10T18:49:10.032718

from itertools import combinations

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(input())

print("")
for i in range(1, n + 1):
    for subset in combinations(numbers, i):
        print(*subset)