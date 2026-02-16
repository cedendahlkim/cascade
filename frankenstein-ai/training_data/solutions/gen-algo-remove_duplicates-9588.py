# Task: gen-algo-remove_duplicates-9588 | Score: 100% | 2026-02-12T13:13:44.285412

n = int(input())
seen = []
for _ in range(n):
    num = int(input())
    if num not in seen:
        seen.append(num)

print(*seen)