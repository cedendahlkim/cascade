# Task: gen-ll-remove_nth-9077 | Score: 100% | 2026-02-12T12:51:00.802199

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))
k = int(input())
numbers.pop(k)
print(*numbers)