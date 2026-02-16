# Task: gen-algo-remove_duplicates-4959 | Score: 100% | 2026-02-12T17:15:41.208809

n = int(input())
seen = []
for _ in range(n):
  num = int(input())
  if num not in seen:
    seen.append(num)
print(*seen)