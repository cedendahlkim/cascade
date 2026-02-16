# Task: gen-algo-remove_duplicates-9627 | Score: 100% | 2026-02-15T12:03:38.528131

n = int(input())
lst = [int(input()) for _ in range(n)]
seen = set()
result = []
for x in lst:
    if x not in seen:
        result.append(x)
        seen.add(x)
print(' '.join(str(x) for x in result))