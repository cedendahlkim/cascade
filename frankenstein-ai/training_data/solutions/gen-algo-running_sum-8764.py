# Task: gen-algo-running_sum-8764 | Score: 100% | 2026-02-14T13:11:53.141865

n = int(input())
lst = [int(input()) for _ in range(n)]
s = 0
result = []
for x in lst:
    s += x
    result.append(s)
print(' '.join(str(x) for x in result))