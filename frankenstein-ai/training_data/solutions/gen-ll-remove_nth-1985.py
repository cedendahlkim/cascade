# Task: gen-ll-remove_nth-1985 | Score: 100% | 2026-02-12T20:39:11.081077

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))
k = int(input())

result = []
for i in range(n):
    if i != k:
        result.append(str(numbers[i]))

print(" ".join(result))