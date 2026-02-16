# Task: gen-ll-remove_nth-6769 | Score: 100% | 2026-02-13T19:15:02.826299

n = int(input())
lst = [int(input()) for _ in range(n)]
k = int(input())
result = lst[:k] + lst[k+1:]
print(' '.join(str(x) for x in result))