# Task: gen-list-count_negative-1804 | Score: 100% | 2026-02-12T14:15:13.021935

n = int(input())
count = 0
for _ in range(n):
  num = int(input())
  if num < 0:
    count += 1
print(count)