# Task: gen-ll-remove_nth-2230 | Score: 100% | 2026-02-13T16:27:12.221022

n = int(input())
lst = [int(input()) for _ in range(n)]
k = int(input())
result = lst[:k] + lst[k+1:]
print(' '.join(str(x) for x in result))