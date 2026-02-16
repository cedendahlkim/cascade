# Task: gen-ll-remove_nth-5952 | Score: 100% | 2026-02-14T12:05:13.882871

n = int(input())
lst = [int(input()) for _ in range(n)]
k = int(input())
result = lst[:k] + lst[k+1:]
print(' '.join(str(x) for x in result))