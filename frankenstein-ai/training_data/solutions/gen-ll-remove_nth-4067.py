# Task: gen-ll-remove_nth-4067 | Score: 100% | 2026-02-13T19:48:23.678101

n = int(input())
lst = [int(input()) for _ in range(n)]
k = int(input())
result = lst[:k] + lst[k+1:]
print(' '.join(str(x) for x in result))