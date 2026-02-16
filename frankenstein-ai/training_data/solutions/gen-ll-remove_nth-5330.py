# Task: gen-ll-remove_nth-5330 | Score: 100% | 2026-02-12T17:36:36.222930

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))
k = int(input())
del numbers[k]
print(*numbers)