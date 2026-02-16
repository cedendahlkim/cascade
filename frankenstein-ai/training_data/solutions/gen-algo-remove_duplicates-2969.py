# Task: gen-algo-remove_duplicates-2969 | Score: 100% | 2026-02-12T12:11:38.609813

n = int(input())
seen = []
result = []
for _ in range(n):
  num = int(input())
  if num not in seen:
    seen.append(num)
    result.append(str(num))

print(' '.join(result))