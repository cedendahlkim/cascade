# Task: gen-ll-remove_nth-5724 | Score: 100% | 2026-02-13T21:27:25.590149

n = int(input())
lst = [int(input()) for _ in range(n)]
k = int(input())
result = lst[:k] + lst[k+1:]
print(' '.join(str(x) for x in result))