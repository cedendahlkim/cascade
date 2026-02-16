# Task: gen-ll-remove_nth-1417 | Score: 100% | 2026-02-13T18:34:51.553590

n = int(input())
lst = [int(input()) for _ in range(n)]
k = int(input())
result = lst[:k] + lst[k+1:]
print(' '.join(str(x) for x in result))