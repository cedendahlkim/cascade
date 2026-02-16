# Task: gen-ll-remove_nth-9794 | Score: 100% | 2026-02-14T13:12:30.390440

n = int(input())
lst = [int(input()) for _ in range(n)]
k = int(input())
result = lst[:k] + lst[k+1:]
print(' '.join(str(x) for x in result))