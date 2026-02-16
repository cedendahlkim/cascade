# Task: gen-ll-remove_nth-5830 | Score: 100% | 2026-02-12T21:17:50.676381

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))
k = int(input())
result = numbers[:k] + numbers[k+1:]
print(*result)