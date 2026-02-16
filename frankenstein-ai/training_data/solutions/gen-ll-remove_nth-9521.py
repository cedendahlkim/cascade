# Task: gen-ll-remove_nth-9521 | Score: 100% | 2026-02-10T15:44:05.621587

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))
k = int(input())

result = []
for i in range(n):
    if i != k:
        result.append(str(numbers[i]))

print(' '.join(result))