# Task: gen-comb-permutations-1795 | Score: 100% | 2026-02-11T08:57:54.051268

import itertools

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))

permutations = list(itertools.permutations(numbers))

for perm in permutations:
    print(*perm)