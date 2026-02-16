# Task: gen-algo-remove_duplicates-9604 | Score: 100% | 2026-02-13T18:46:06.744686

n = int(input())
lst = [int(input()) for _ in range(n)]
seen = set()
result = []
for x in lst:
    if x not in seen:
        result.append(x)
        seen.add(x)
print(' '.join(str(x) for x in result))