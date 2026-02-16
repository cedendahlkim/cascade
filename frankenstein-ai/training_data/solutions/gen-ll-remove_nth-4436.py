# Task: gen-ll-remove_nth-4436 | Score: 100% | 2026-02-15T13:31:02.688979

n = int(input())
lst = [int(input()) for _ in range(n)]
k = int(input())
result = lst[:k] + lst[k+1:]
print(' '.join(str(x) for x in result))