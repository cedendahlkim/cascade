# Task: gen-ll-remove_nth-6384 | Score: 100% | 2026-02-13T20:32:50.454686

n = int(input())
lst = [int(input()) for _ in range(n)]
k = int(input())
result = lst[:k] + lst[k+1:]
print(' '.join(str(x) for x in result))