# Task: gen-algo-remove_duplicates-3673 | Score: 100% | 2026-02-12T17:15:50.832940

n = int(input())
seen = []
for _ in range(n):
  num = int(input())
  if num not in seen:
    seen.append(num)
print(*seen)