# Task: gen-ll-remove_nth-2748 | Score: 100% | 2026-02-15T07:49:19.142772

n = int(input())
lst = [int(input()) for _ in range(n)]
k = int(input())
result = lst[:k] + lst[k+1:]
print(' '.join(str(x) for x in result))