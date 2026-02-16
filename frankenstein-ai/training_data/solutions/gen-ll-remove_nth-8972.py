# Task: gen-ll-remove_nth-8972 | Score: 100% | 2026-02-13T20:32:28.720136

n = int(input())
lst = [int(input()) for _ in range(n)]
k = int(input())
result = lst[:k] + lst[k+1:]
print(' '.join(str(x) for x in result))