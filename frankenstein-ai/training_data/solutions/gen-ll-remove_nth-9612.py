# Task: gen-ll-remove_nth-9612 | Score: 100% | 2026-02-15T11:37:05.275483

n = int(input())
lst = [int(input()) for _ in range(n)]
k = int(input())
result = lst[:k] + lst[k+1:]
print(' '.join(str(x) for x in result))