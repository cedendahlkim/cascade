# Task: gen-ll-remove_nth-6584 | Score: 100% | 2026-02-13T21:49:01.360873

n = int(input())
lst = [int(input()) for _ in range(n)]
k = int(input())
result = lst[:k] + lst[k+1:]
print(' '.join(str(x) for x in result))