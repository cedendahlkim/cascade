# Task: gen-algo-remove_duplicates-2177 | Score: 100% | 2026-02-12T12:14:23.434015

n = int(input())
seen = []
for _ in range(n):
    num = int(input())
    if num not in seen:
        seen.append(num)
print(*seen)