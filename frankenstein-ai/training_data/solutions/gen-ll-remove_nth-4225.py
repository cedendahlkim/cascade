# Task: gen-ll-remove_nth-4225 | Score: 100% | 2026-02-15T10:09:34.112674

n = int(input())
lst = [int(input()) for _ in range(n)]
k = int(input())
result = lst[:k] + lst[k+1:]
print(' '.join(str(x) for x in result))