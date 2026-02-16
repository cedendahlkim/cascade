# Task: gen-algo-remove_duplicates-7672 | Score: 100% | 2026-02-10T15:42:46.986962

n = int(input())
seen = set()
result = []
for _ in range(n):
    num = int(input())
    if num not in seen:
        result.append(str(num))
        seen.add(num)
print(' '.join(result))