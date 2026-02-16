# Task: gen-ll-remove_nth-2082 | Score: 100% | 2026-02-15T09:34:05.065473

n = int(input())
lst = [int(input()) for _ in range(n)]
k = int(input())
result = lst[:k] + lst[k+1:]
print(' '.join(str(x) for x in result))