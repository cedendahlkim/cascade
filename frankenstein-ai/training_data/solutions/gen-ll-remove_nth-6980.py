# Task: gen-ll-remove_nth-6980 | Score: 100% | 2026-02-13T12:23:21.436880

n = int(input())
lst = [int(input()) for _ in range(n)]
k = int(input())
result = lst[:k] + lst[k+1:]
print(' '.join(str(x) for x in result))