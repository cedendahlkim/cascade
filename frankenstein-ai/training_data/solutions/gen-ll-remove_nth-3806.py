# Task: gen-ll-remove_nth-3806 | Score: 100% | 2026-02-12T19:51:16.159601

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))
k = int(input())
numbers.pop(k)
print(*numbers)