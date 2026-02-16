# Task: gen-ll-remove_nth-7510 | Score: 100% | 2026-02-15T09:51:10.246484

n = int(input())
lst = [int(input()) for _ in range(n)]
k = int(input())
result = lst[:k] + lst[k+1:]
print(' '.join(str(x) for x in result))