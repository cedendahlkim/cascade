# Task: gen-ll-remove_nth-7181 | Score: 100% | 2026-02-14T12:03:05.995760

n = int(input())
lst = [int(input()) for _ in range(n)]
k = int(input())
result = lst[:k] + lst[k+1:]
print(' '.join(str(x) for x in result))