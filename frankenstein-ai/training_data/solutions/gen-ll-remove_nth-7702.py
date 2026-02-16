# Task: gen-ll-remove_nth-7702 | Score: 100% | 2026-02-13T20:17:34.415544

n = int(input())
lst = [int(input()) for _ in range(n)]
k = int(input())
result = lst[:k] + lst[k+1:]
print(' '.join(str(x) for x in result))