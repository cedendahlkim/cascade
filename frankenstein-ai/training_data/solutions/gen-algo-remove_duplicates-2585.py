# Task: gen-algo-remove_duplicates-2585 | Score: 100% | 2026-02-12T15:56:00.265160

n = int(input())
seen = []
for _ in range(n):
    num = int(input())
    if num not in seen:
        seen.append(num)

print(*seen)