# Task: gen-ll-remove_nth-5513 | Score: 100% | 2026-02-13T19:05:23.449510

n = int(input())
lst = [int(input()) for _ in range(n)]
k = int(input())
result = lst[:k] + lst[k+1:]
print(' '.join(str(x) for x in result))