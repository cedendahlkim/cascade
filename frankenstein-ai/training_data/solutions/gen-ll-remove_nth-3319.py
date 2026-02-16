# Task: gen-ll-remove_nth-3319 | Score: 100% | 2026-02-15T08:14:47.606729

n = int(input())
lst = [int(input()) for _ in range(n)]
k = int(input())
result = lst[:k] + lst[k+1:]
print(' '.join(str(x) for x in result))