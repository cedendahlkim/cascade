# Task: gen-ll-remove_nth-7343 | Score: 100% | 2026-02-13T18:45:55.427075

n = int(input())
lst = [int(input()) for _ in range(n)]
k = int(input())
result = lst[:k] + lst[k+1:]
print(' '.join(str(x) for x in result))