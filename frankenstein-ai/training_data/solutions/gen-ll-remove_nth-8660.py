# Task: gen-ll-remove_nth-8660 | Score: 100% | 2026-02-12T14:50:36.804674

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))
k = int(input())
result = numbers[:k] + numbers[k+1:]
print(*result)