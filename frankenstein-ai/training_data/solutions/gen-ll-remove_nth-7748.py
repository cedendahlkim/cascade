# Task: gen-ll-remove_nth-7748 | Score: 100% | 2026-02-14T13:26:20.111154

n = int(input())
lst = [int(input()) for _ in range(n)]
k = int(input())
result = lst[:k] + lst[k+1:]
print(' '.join(str(x) for x in result))