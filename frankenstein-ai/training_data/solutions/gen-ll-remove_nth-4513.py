# Task: gen-ll-remove_nth-4513 | Score: 100% | 2026-02-13T20:33:00.371121

n = int(input())
lst = [int(input()) for _ in range(n)]
k = int(input())
result = lst[:k] + lst[k+1:]
print(' '.join(str(x) for x in result))