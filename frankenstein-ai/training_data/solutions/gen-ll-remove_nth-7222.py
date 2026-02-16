# Task: gen-ll-remove_nth-7222 | Score: 100% | 2026-02-13T13:47:05.356844

n = int(input())
lst = [int(input()) for _ in range(n)]
k = int(input())
result = lst[:k] + lst[k+1:]
print(' '.join(str(x) for x in result))