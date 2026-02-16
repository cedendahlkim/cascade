# Task: gen-ll-remove_nth-6996 | Score: 100% | 2026-02-13T09:51:20.384505

n = int(input())
lst = [int(input()) for _ in range(n)]
k = int(input())
result = lst[:k] + lst[k+1:]
print(' '.join(str(x) for x in result))