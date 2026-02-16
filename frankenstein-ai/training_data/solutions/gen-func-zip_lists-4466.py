# Task: gen-func-zip_lists-4466 | Score: 100% | 2026-02-12T13:25:05.515720

n = int(input())
a = []
b = []
for _ in range(n):
  a.append(int(input()))
for _ in range(n):
  b.append(int(input()))

result = ' '.join([f'{x},{y}' for x, y in zip(a, b)])
print(result)