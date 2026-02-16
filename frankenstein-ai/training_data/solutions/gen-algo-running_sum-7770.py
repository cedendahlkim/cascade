# Task: gen-algo-running_sum-7770 | Score: 100% | 2026-02-13T16:07:10.447996

n = int(input())
lst = [int(input()) for _ in range(n)]
s = 0
result = []
for x in lst:
    s += x
    result.append(s)
print(' '.join(str(x) for x in result))