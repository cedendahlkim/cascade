# Task: gen-ll-remove_nth-6893 | Score: 100% | 2026-02-12T20:39:47.004757

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))
k = int(input())
numbers.pop(k)
print(*numbers)