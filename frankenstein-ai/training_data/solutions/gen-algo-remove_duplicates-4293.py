# Task: gen-algo-remove_duplicates-4293 | Score: 100% | 2026-02-12T20:30:25.292026

n = int(input())
seen = []
for _ in range(n):
  num = int(input())
  if num not in seen:
    seen.append(num)

print(*seen)