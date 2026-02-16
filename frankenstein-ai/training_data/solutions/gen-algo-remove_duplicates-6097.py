# Task: gen-algo-remove_duplicates-6097 | Score: 100% | 2026-02-12T12:11:02.768578

n = int(input())
seen = []
for _ in range(n):
  x = int(input())
  if x not in seen:
    seen.append(x)

print(*seen)