# Task: gen-ll-remove_nth-5918 | Score: 100% | 2026-02-13T18:23:49.568056

n = int(input())
lst = [int(input()) for _ in range(n)]
k = int(input())
result = lst[:k] + lst[k+1:]
print(' '.join(str(x) for x in result))