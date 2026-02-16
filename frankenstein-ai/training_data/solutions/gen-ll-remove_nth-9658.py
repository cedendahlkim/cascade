# Task: gen-ll-remove_nth-9658 | Score: 100% | 2026-02-12T13:43:51.413964

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))
k = int(input())
numbers.pop(k)
print(*numbers)