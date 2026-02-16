# Task: gen-algo-running_sum-7199 | Score: 100% | 2026-02-15T08:05:34.887858

n = int(input())
lst = [int(input()) for _ in range(n)]
s = 0
result = []
for x in lst:
    s += x
    result.append(s)
print(' '.join(str(x) for x in result))