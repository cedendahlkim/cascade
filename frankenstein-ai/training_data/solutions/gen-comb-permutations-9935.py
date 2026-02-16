# Task: gen-comb-permutations-9935 | Score: 100% | 2026-02-11T10:52:47.374182

import itertools

N = int(input())
numbers = []
for _ in range(N):
    numbers.append(int(input()))

permutations = list(itertools.permutations(numbers))

for perm in permutations:
    print(*perm)