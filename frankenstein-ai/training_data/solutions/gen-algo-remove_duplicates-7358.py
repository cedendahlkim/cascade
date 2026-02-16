# Task: gen-algo-remove_duplicates-7358 | Score: 100% | 2026-02-12T12:19:31.589400

n = int(input())
seen = []
for _ in range(n):
  num = int(input())
  if num not in seen:
    seen.append(num)
print(*seen)