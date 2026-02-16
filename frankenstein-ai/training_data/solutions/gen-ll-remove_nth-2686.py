# Task: gen-ll-remove_nth-2686 | Score: 100% | 2026-02-13T13:53:47.888741

n = int(input())
lst = [int(input()) for _ in range(n)]
k = int(input())
result = lst[:k] + lst[k+1:]
print(' '.join(str(x) for x in result))