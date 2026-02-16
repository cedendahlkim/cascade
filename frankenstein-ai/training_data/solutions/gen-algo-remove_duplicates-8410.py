# Task: gen-algo-remove_duplicates-8410 | Score: 100% | 2026-02-12T12:08:14.467959

n = int(input())
seen = []
for _ in range(n):
    num = int(input())
    if num not in seen:
        seen.append(num)
print(*seen)