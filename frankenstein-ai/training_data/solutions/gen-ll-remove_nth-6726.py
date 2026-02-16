# Task: gen-ll-remove_nth-6726 | Score: 100% | 2026-02-14T12:59:56.257990

n = int(input())
lst = [int(input()) for _ in range(n)]
k = int(input())
result = lst[:k] + lst[k+1:]
print(' '.join(str(x) for x in result))