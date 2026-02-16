# Task: gen-ll-remove_nth-8689 | Score: 100% | 2026-02-13T19:35:59.746292

n = int(input())
lst = [int(input()) for _ in range(n)]
k = int(input())
result = lst[:k] + lst[k+1:]
print(' '.join(str(x) for x in result))