# Task: gen-ll-remove_nth-9389 | Score: 100% | 2026-02-15T13:30:06.584406

n = int(input())
lst = [int(input()) for _ in range(n)]
k = int(input())
result = lst[:k] + lst[k+1:]
print(' '.join(str(x) for x in result))