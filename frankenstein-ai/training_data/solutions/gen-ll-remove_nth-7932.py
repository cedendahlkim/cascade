# Task: gen-ll-remove_nth-7932 | Score: 100% | 2026-02-14T13:12:37.102986

n = int(input())
lst = [int(input()) for _ in range(n)]
k = int(input())
result = lst[:k] + lst[k+1:]
print(' '.join(str(x) for x in result))