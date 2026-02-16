# Task: gen-ll-remove_nth-2364 | Score: 100% | 2026-02-15T08:48:03.776518

n = int(input())
lst = [int(input()) for _ in range(n)]
k = int(input())
result = lst[:k] + lst[k+1:]
print(' '.join(str(x) for x in result))