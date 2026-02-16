# Task: gen-ll-remove_nth-2806 | Score: 100% | 2026-02-13T17:35:59.221664

n = int(input())
lst = [int(input()) for _ in range(n)]
k = int(input())
result = lst[:k] + lst[k+1:]
print(' '.join(str(x) for x in result))