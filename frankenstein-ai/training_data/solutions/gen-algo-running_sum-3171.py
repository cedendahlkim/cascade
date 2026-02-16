# Task: gen-algo-running_sum-3171 | Score: 100% | 2026-02-13T18:46:40.439710

n = int(input())
lst = [int(input()) for _ in range(n)]
s = 0
result = []
for x in lst:
    s += x
    result.append(s)
print(' '.join(str(x) for x in result))