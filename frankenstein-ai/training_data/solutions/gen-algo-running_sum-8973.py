# Task: gen-algo-running_sum-8973 | Score: 100% | 2026-02-13T20:17:08.457088

n = int(input())
lst = [int(input()) for _ in range(n)]
s = 0
result = []
for x in lst:
    s += x
    result.append(s)
print(' '.join(str(x) for x in result))