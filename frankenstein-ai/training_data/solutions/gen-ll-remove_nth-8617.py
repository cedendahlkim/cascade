# Task: gen-ll-remove_nth-8617 | Score: 100% | 2026-02-12T12:50:42.528592

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))
k = int(input())
result = numbers[:k] + numbers[k+1:]
print(*result)