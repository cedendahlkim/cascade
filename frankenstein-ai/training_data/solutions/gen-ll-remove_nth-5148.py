# Task: gen-ll-remove_nth-5148 | Score: 100% | 2026-02-13T19:47:59.760846

n = int(input())
lst = [int(input()) for _ in range(n)]
k = int(input())
result = lst[:k] + lst[k+1:]
print(' '.join(str(x) for x in result))