# Task: gen-ll-remove_nth-3593 | Score: 100% | 2026-02-12T13:59:41.960121

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))
k = int(input())
result = numbers[:k] + numbers[k+1:]
print(*result)