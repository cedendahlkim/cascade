# Task: gen-ll-remove_nth-8469 | Score: 100% | 2026-02-13T09:22:45.415267

n = int(input())
lst = [int(input()) for _ in range(n)]
k = int(input())
result = lst[:k] + lst[k+1:]
print(' '.join(str(x) for x in result))