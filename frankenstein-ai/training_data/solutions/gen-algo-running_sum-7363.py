# Task: gen-algo-running_sum-7363 | Score: 100% | 2026-02-15T12:03:35.963189

n = int(input())
lst = [int(input()) for _ in range(n)]
s = 0
result = []
for x in lst:
    s += x
    result.append(s)
print(' '.join(str(x) for x in result))