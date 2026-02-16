# Task: gen-algo-running_sum-4165 | Score: 100% | 2026-02-13T11:23:15.735991

n = int(input())
lst = [int(input()) for _ in range(n)]
s = 0
result = []
for x in lst:
    s += x
    result.append(s)
print(' '.join(str(x) for x in result))