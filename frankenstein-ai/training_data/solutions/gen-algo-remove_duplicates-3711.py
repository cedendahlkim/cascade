# Task: gen-algo-remove_duplicates-3711 | Score: 100% | 2026-02-12T12:42:35.578400

n = int(input())
seen = []
for _ in range(n):
    num = int(input())
    if num not in seen:
        seen.append(num)
print(*seen)