# Task: gen-algo-remove_duplicates-7873 | Score: 100% | 2026-02-13T16:06:56.476593

n = int(input())
lst = [int(input()) for _ in range(n)]
seen = set()
result = []
for x in lst:
    if x not in seen:
        result.append(x)
        seen.add(x)
print(' '.join(str(x) for x in result))