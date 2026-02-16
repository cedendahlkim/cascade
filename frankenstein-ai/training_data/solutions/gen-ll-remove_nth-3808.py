# Task: gen-ll-remove_nth-3808 | Score: 100% | 2026-02-13T21:07:47.546072

n = int(input())
lst = [int(input()) for _ in range(n)]
k = int(input())
result = lst[:k] + lst[k+1:]
print(' '.join(str(x) for x in result))