# Task: gen-ll-remove_nth-1246 | Score: 100% | 2026-02-17T20:33:22.368600

n = int(input())
lst = [int(input()) for _ in range(n)]
k = int(input())
result = lst[:k] + lst[k+1:]
print(' '.join(str(x) for x in result))