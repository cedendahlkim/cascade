# Task: gen-ll-remove_nth-7240 | Score: 100% | 2026-02-13T13:11:47.756643

n = int(input())
lst = [int(input()) for _ in range(n)]
k = int(input())
result = lst[:k] + lst[k+1:]
print(' '.join(str(x) for x in result))