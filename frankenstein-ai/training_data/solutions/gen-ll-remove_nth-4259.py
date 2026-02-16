# Task: gen-ll-remove_nth-4259 | Score: 100% | 2026-02-13T14:41:50.970955

n = int(input())
lst = [int(input()) for _ in range(n)]
k = int(input())
result = lst[:k] + lst[k+1:]
print(' '.join(str(x) for x in result))