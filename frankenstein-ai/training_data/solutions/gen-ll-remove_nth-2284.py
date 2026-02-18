# Task: gen-ll-remove_nth-2284 | Score: 100% | 2026-02-17T20:35:03.630383

n = int(input())
lst = [int(input()) for _ in range(n)]
k = int(input())
result = lst[:k] + lst[k+1:]
print(' '.join(str(x) for x in result))