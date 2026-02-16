# Task: gen-ll-remove_nth-5261 | Score: 100% | 2026-02-12T13:29:48.128793

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