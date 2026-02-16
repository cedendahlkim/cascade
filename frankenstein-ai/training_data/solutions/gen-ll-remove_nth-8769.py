# Task: gen-ll-remove_nth-8769 | Score: 100% | 2026-02-14T12:07:57.650036

n = int(input())
lst = [int(input()) for _ in range(n)]
k = int(input())
result = lst[:k] + lst[k+1:]
print(' '.join(str(x) for x in result))