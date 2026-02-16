# Task: gen-algo-remove_duplicates-5678 | Score: 100% | 2026-02-13T14:56:38.658755

n = int(input())
lst = [int(input()) for _ in range(n)]
seen = set()
result = []
for x in lst:
    if x not in seen:
        result.append(x)
        seen.add(x)
print(' '.join(str(x) for x in result))