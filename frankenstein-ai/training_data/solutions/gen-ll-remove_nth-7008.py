# Task: gen-ll-remove_nth-7008 | Score: 100% | 2026-02-13T21:28:04.962157

n = int(input())
lst = [int(input()) for _ in range(n)]
k = int(input())
result = lst[:k] + lst[k+1:]
print(' '.join(str(x) for x in result))