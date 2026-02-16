# Task: gen-comb-permutations-6084 | Score: 100% | 2026-02-10T18:34:43.205987

import itertools

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))

permutations = list(itertools.permutations(numbers))

for perm in permutations:
    print(' '.join(map(str, perm)))