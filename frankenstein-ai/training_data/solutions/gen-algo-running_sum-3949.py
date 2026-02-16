# Task: gen-algo-running_sum-3949 | Score: 100% | 2026-02-13T16:06:59.327453

n = int(input())
lst = [int(input()) for _ in range(n)]
s = 0
result = []
for x in lst:
    s += x
    result.append(s)
print(' '.join(str(x) for x in result))