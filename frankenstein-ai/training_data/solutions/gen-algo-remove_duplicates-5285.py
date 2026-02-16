# Task: gen-algo-remove_duplicates-5285 | Score: 100% | 2026-02-12T12:32:20.564821

n = int(input())
seen = set()
result = []
for _ in range(n):
    num = int(input())
    if num not in seen:
        result.append(str(num))
        seen.add(num)
print(' '.join(result))