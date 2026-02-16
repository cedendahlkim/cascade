# Task: gen-ll-remove_nth-4096 | Score: 100% | 2026-02-13T12:21:53.234303

n = int(input())
lst = [int(input()) for _ in range(n)]
k = int(input())
result = lst[:k] + lst[k+1:]
print(' '.join(str(x) for x in result))