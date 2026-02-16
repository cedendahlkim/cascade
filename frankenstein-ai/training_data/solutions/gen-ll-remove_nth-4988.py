# Task: gen-ll-remove_nth-4988 | Score: 100% | 2026-02-12T13:44:15.199681

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))
k = int(input())
result = numbers[:k] + numbers[k+1:]
print(*result)