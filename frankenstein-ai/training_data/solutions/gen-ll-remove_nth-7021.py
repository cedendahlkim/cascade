# Task: gen-ll-remove_nth-7021 | Score: 100% | 2026-02-13T20:50:06.019481

n = int(input())
lst = [int(input()) for _ in range(n)]
k = int(input())
result = lst[:k] + lst[k+1:]
print(' '.join(str(x) for x in result))