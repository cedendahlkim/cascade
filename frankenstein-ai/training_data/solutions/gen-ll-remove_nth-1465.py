# Task: gen-ll-remove_nth-1465 | Score: 100% | 2026-02-13T11:45:30.868602

n = int(input())
lst = [int(input()) for _ in range(n)]
k = int(input())
result = lst[:k] + lst[k+1:]
print(' '.join(str(x) for x in result))