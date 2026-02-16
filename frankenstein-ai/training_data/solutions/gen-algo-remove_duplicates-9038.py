# Task: gen-algo-remove_duplicates-9038 | Score: 100% | 2026-02-12T20:29:50.007784

n = int(input())
seen = set()
result = []
for _ in range(n):
    num = int(input())
    if num not in seen:
        result.append(str(num))
        seen.add(num)
print(' '.join(result))