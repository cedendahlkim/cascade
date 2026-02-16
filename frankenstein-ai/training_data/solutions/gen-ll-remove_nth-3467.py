# Task: gen-ll-remove_nth-3467 | Score: 100% | 2026-02-15T09:02:13.726286

n = int(input())
lst = [int(input()) for _ in range(n)]
k = int(input())
result = lst[:k] + lst[k+1:]
print(' '.join(str(x) for x in result))