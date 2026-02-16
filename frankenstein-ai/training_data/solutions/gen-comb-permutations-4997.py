# Task: gen-comb-permutations-4997 | Score: 100% | 2026-02-10T18:51:56.740176

import itertools

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))

permutations = list(itertools.permutations(numbers))

for perm in permutations:
    print(*perm)