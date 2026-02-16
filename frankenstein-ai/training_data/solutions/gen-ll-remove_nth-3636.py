# Task: gen-ll-remove_nth-3636 | Score: 100% | 2026-02-11T12:09:39.264389

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))
k = int(input())
result = numbers[:k] + numbers[k+1:]
print(*result)