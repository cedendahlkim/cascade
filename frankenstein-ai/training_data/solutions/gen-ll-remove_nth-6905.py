# Task: gen-ll-remove_nth-6905 | Score: 100% | 2026-02-13T09:04:48.670911

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))
k = int(input())
result = []
for i in range(n):
    if i != k:
        result.append(str(numbers[i]))
print(' '.join(result))