# Task: gen-comb-permutations-8629 | Score: 100% | 2026-02-11T07:26:51.659119

import itertools

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(input())

permutations = list(itertools.permutations(numbers))

for perm in permutations:
    print(*perm)