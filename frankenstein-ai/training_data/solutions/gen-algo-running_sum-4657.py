# Task: gen-algo-running_sum-4657 | Score: 100% | 2026-02-13T18:33:48.492774

n = int(input())
lst = [int(input()) for _ in range(n)]
s = 0
result = []
for x in lst:
    s += x
    result.append(s)
print(' '.join(str(x) for x in result))