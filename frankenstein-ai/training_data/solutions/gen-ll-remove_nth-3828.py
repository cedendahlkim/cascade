# Task: gen-ll-remove_nth-3828 | Score: 100% | 2026-02-13T21:49:23.267339

n = int(input())
lst = [int(input()) for _ in range(n)]
k = int(input())
result = lst[:k] + lst[k+1:]
print(' '.join(str(x) for x in result))