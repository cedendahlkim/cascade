# Task: gen-algo-running_sum-2066 | Score: 100% | 2026-02-17T20:03:20.373281

n = int(input())
lst = [int(input()) for _ in range(n)]
s = 0
result = []
for x in lst:
    s += x
    result.append(s)
print(' '.join(str(x) for x in result))