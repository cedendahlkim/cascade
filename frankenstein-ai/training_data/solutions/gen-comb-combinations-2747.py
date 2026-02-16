# Task: gen-comb-combinations-2747 | Score: 100% | 2026-02-11T11:44:56.271084

from itertools import combinations

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))
k = int(input())

for combination in combinations(numbers, k):
    print(*combination)