# Task: gen-ll-remove_nth-6641 | Score: 100% | 2026-02-12T16:45:25.410359

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