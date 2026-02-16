# Task: gen-ll-remove_nth-5970 | Score: 100% | 2026-02-15T09:51:07.775308

n = int(input())
lst = [int(input()) for _ in range(n)]
k = int(input())
result = lst[:k] + lst[k+1:]
print(' '.join(str(x) for x in result))